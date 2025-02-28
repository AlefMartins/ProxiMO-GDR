const jwt = require('jsonwebtoken');
const { User } = require('../database/models');
const redisClient = require('../config/redis');

exports.authenticate = async (req, res, next) => {
  try {
    // Verificar se o token foi fornecido
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Extrair o token do header
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Formato de token inválido' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se o token existe no Redis
    const storedToken = await redisClient.get(`token:${decoded.id}`);
    if (!storedToken || storedToken !== token) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    // Buscar usuário
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Usuário não encontrado ou inativo' });
    }

    // Adicionar usuário à requisição
    req.user = decoded;
    
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    
    console.error('Erro na autenticação:', err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
