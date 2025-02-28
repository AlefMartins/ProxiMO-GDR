const express = require('express');
const http = require('http');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { sequelize } = require('./database/models');
const redisClient = require('./config/redis');

// Rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const settingRoutes = require('./routes/settingRoutes');

// Serviços
const ldapService = require('./services/ldapService');
const tacacsService = require('./services/tacacsService');
const radiusService = require('./services/radiusService');
const terminalService = require('./services/terminalService');

// Inicializar app
const app = express();
const server = http.createServer(app);

// Middleware para logging
app.use(morgan('dev'));

// Middleware de segurança
app.use(helmet());
app.use(cors());

// Middleware para parsing de JSON e form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configurar rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/settings', settingRoutes);

// Rota de saúde para monitoramento
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Middleware para lidar com rotas não encontradas
app.use((req, res, next) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware para lidar com erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

// Inicializar serviços
const initServices = async () => {
  try {
    console.log('Inicializando serviços...');
    
    // Inicializar conexão com o banco de dados
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso');
    
    // Inicializar Redis
    await redisClient.connect();
    console.log('Conexão com o Redis estabelecida com sucesso');
    
    // Inicializar LDAP
    await ldapService.initialize();
    
    // Inicializar TACACS+
    await tacacsService.initialize();
    
    // Inicializar RADIUS
    await radiusService.initialize();
    
    // Inicializar serviço de terminal
    terminalService.initialize(server);
    
    console.log('Todos os serviços inicializados com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar serviços:', error);
    process.exit(1);
  }
};

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await initServices();
});

// Lidar com desligamento gracioso
process.on('SIGTERM', async () => {
  console.log('Sinal SIGTERM recebido, desligando servidor...');
  
  // Encerrar todas as conexões de terminal
  terminalService.closeAllConnections();
  
  // Fechar conexão com o Redis
  await redisClient.disconnect();
  
  // Fechar conexão com o banco de dados
  await sequelize.close();
  
  // Fechar conexão LDAP
  ldapService.close();
  
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

module.exports = { app, server };
