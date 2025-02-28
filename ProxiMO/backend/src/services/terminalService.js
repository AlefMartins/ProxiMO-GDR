const { Client } = require('ssh2');
const WebSocket = require('ws');
const { Device, User, AccessLog, CommandLog } = require('../database/models');
const jwt = require('jsonwebtoken');
const tacacsService = require('./tacacsService');

class TerminalService {
  constructor() {
    this.connections = new Map();
    this.wsServer = null;
  }

  // Inicializar o serviço de terminal com o servidor
  initialize(server) {
    // Criar servidor WebSocket
    this.wsServer = new WebSocket.Server({ server, path: '/api/terminal' });

    // Configurar eventos do servidor WebSocket
    this.wsServer.on('connection', async (ws, req) => {
      try {
        // Extrair token da URL
        const url = new URL(req.url, 'http://localhost');
        const token = url.searchParams.get('token');
        const deviceId = url.searchParams.get('deviceId');
        const protocol = url.searchParams.get('protocol') || 'ssh';

        if (!token || !deviceId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Token ou ID do dispositivo não fornecido' }));
          ws.close();
          return;
        }

        // Verificar token
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
          ws.send(JSON.stringify({ type: 'error', message: 'Token inválido ou expirado' }));
          ws.close();
          return;
        }

        // Buscar usuário e dispositivo
        const user = await User.findByPk(decoded.id);
        const device = await Device.findByPk(deviceId);

        if (!user || !device) {
          ws.send(JSON.stringify({ type: 'error', message: 'Usuário ou dispositivo não encontrado' }));
          ws.close();
          return;
        }

        // Verificar se o dispositivo está online
        if (device.status !== 'online') {
          ws.send(JSON.stringify({ type: 'error', message: 'O dispositivo não está online' }));
          ws.close();
          return;
        }

        // Verificar se o protocolo é suportado
        if (protocol === 'ssh' && !device.supportsSsh) {
          ws.send(JSON.stringify({ type: 'error', message: 'Este dispositivo não suporta SSH' }));
          ws.close();
          return;
        }

        if (protocol === 'telnet' && !device.supportsTelnet) {
          ws.send(JSON.stringify({ type: 'error', message: 'Este dispositivo não suporta Telnet' }));
          ws.close();
          return;
        }

        // Gerar ID único para a sessão
        const sessionId = `${user.id}_${device.id}_${Date.now()}`;

        // Registrar início da sessão
        const accessLog = await AccessLog.create({
          userId: user.id,
          deviceId: device.id,
          ipAddress: req.socket.remoteAddress,
          accessType: `connect-${protocol}`,
          status: 'success',
          details: `Conexão ${protocol.toUpperCase()} iniciada para ${device.name} (${device.ipAddress})`
        });

        // Enviar mensagem de boas-vindas
        ws.send(JSON.stringify({
          type: 'info',
          message: `Conectando a ${device.name} (${device.ipAddress}) via ${protocol.toUpperCase()}...`
        }));

        // Estabelecer conexão SSH
        if (protocol === 'ssh') {
          this.handleSshConnection(ws, user, device, sessionId, accessLog.id);
        } else if (protocol === 'telnet') {
          this.handleTelnetConnection(ws, user, device, sessionId, accessLog.id);
        }

        // Armazenar conexão
        this.connections.set(sessionId, {
          ws,
          user,
          device,
          protocol,
          accessLogId: accessLog.id,
          startTime: new Date(),
          buffer: '',
          client: null
        });

        // Lidar com fechamento de conexão
        ws.on('close', async () => {
          await this.handleConnectionClose(sessionId);
        });

        // Lidar com erros
        ws.on('error', async (error) => {
          console.error(`Erro na conexão WebSocket para sessão ${sessionId}:`, error);
          ws.send(JSON.stringify({ type: 'error', message: `Erro na conexão WebSocket: ${error.message}` }));
          await this.handleConnectionClose(sessionId);
        });
      } catch (error) {
        console.error('Erro ao estabelecer conexão WebSocket:', error);
        ws.send(JSON.stringify({ type: 'error', message: `Erro interno do servidor: ${error.message}` }));
        ws.close();
      }
    });

    console.log('Serviço de terminal inicializado');
  }

  // Lidar com conexão SSH
  handleSshConnection(ws, user, device, sessionId, accessLogId) {
    const conn = new Client();
    
    // Armazenar a conexão SSH no mapa de conexões
    const connectionInfo = this.connections.get(sessionId);
    if (connectionInfo) {
      connectionInfo.client = conn;
    }

    // Configurar eventos da conexão SSH
    conn.on('ready', () => {
      ws.send(JSON.stringify({
        type: 'info',
        message: `Conexão SSH estabelecida com ${device.name}`
      }));

      // Solicitar shell interativo
      conn.shell({ term: 'xterm-color' }, (err, stream) => {
        if (err) {
          ws.send(JSON.stringify({ type: 'error', message: `Erro ao abrir shell: ${err.message}` }));
          conn.end();
          return;
        }

        // Configurar eventos do stream
        stream.on('data', (data) => {
          const dataStr = data.toString('utf8');
          ws.send(JSON.stringify({ type: 'data', data: dataStr }));
          
          // Armazenar dados no buffer para detecção de comando
          const connectionInfo = this.connections.get(sessionId);
          if (connectionInfo) {
            connectionInfo.buffer += dataStr;
            
            // Verificar se há uma linha de comando completa
            if (connectionInfo.buffer.includes('\n') || connectionInfo.buffer.includes('\r')) {
              this.processCommandBuffer(connectionInfo);
            }
          }
        });

        stream.on('close', () => {
          ws.send(JSON.stringify({ type: 'info', message: 'Sessão SSH encerrada pelo servidor remoto' }));
          conn.end();
        });

        stream.on('error', (err) => {
          ws.send(JSON.stringify({ type: 'error', message: `Erro no stream SSH: ${err.message}` }));
          conn.end();
        });

        // Configurar recebimento de dados do WebSocket
        ws.on('message', (message) => {
          try {
            const msgObj = JSON.parse(message);
            
            if (msgObj.type === 'data') {
              stream.write(msgObj.data);
              
              // Se o dado for enter (CR ou LF), atualizar o buffer para detectar comandos
              if (msgObj.data === '\r' || msgObj.data === '\n') {
                const connectionInfo = this.connections.get(sessionId);
                if (connectionInfo) {
                  this.processCommandBuffer(connectionInfo);
                }
              }
              
              // Adicionar ao buffer
              const connectionInfo = this.connections.get(sessionId);
              if (connectionInfo) {
                connectionInfo.buffer += msgObj.data;
              }
            } else if (msgObj.type === 'resize') {
              // Lidar com redimensionamento do terminal
              stream.setWindow(msgObj.rows, msgObj.cols, msgObj.height, msgObj.width);
            }
          } catch (error) {
            console.error(`Erro ao processar mensagem do WebSocket para sessão ${sessionId}:`, error);
          }
        });
      });
    });

    conn.on('error', (err) => {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: `Erro na conexão SSH: ${err.message}` 
      }));
      
      // Registrar erro na conexão
      AccessLog.update(
        { 
          status: 'failure',
          details: `Falha na conexão SSH para ${device.name} (${device.ipAddress}): ${err.message}`
        },
        { where: { id: accessLogId } }
      );
    });

    // Tentar estabelecer conexão SSH
    conn.connect({
      host: device.ipAddress,
      port: device.port || 22,
      username: user.username,
      // Aqui você precisaria de um mecanismo seguro para armazenar e recuperar senhas
      // Esta é uma implementação simplificada para demonstração
      password: process.env.DEFAULT_DEVICE_PASSWORD || 'password',
      readyTimeout: 30000,
      // Aceitar chaves de host desconhecidas (não seguro para produção)
      algorithms: {
        serverHostKey: [
          'ssh-rsa',
          'ssh-dss',
          'ecdsa-sha2-nistp256',
          'ecdsa-sha2-nistp384',
          'ecdsa-sha2-nistp521'
        ]
      }
    });
  }

  // Lidar com conexão Telnet (simplificado, expandir conforme necessário)
  handleTelnetConnection(ws, user, device, sessionId, accessLogId) {
    // Implementação simplificada - em produção você precisará de uma biblioteca Telnet completa
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Conexões Telnet ainda não estão implementadas completamente'
    }));
    
    // Você poderia usar pacotes como 'telnet-client' para implementar essa funcionalidade
  }

  // Processar buffer para detectar comandos
  processCommandBuffer(connectionInfo) {
    // Detectar linhas de comando completas
    const lines = connectionInfo.buffer.split(/[\r\n]+/);
    
    if (lines.length > 1) {
      // O último elemento pode ser uma linha incompleta, então guardamos
      connectionInfo.buffer = lines.pop();
      
      // Processar linhas completas para encontrar comandos
      lines.forEach(line => {
        // Remover prompts comuns e espaços em branco
        const trimmedLine = line.trim();
        
        // Verificar se parece um comando (não começa com caracteres de prompt)
        if (trimmedLine && !trimmedLine.match(/^[#>\$\]%]/)) {
          this.logCommand(connectionInfo.user, connectionInfo.device, trimmedLine);
          
          // Se o TACACS+ estiver configurado, enviar para accounting
          if (tacacsService.isInitialized) {
            tacacsService.logCommand(
              connectionInfo.user.username,
              connectionInfo.device.ipAddress,
              trimmedLine
            ).catch(err => {
              console.error(`Erro ao enviar comando para TACACS+: ${err.message}`);
            });
          }
        }
      });
    }
  }

  // Registrar comando no banco de dados
  async logCommand(user, device, command) {
    try {
      await CommandLog.create({
        userId: user.id,
        deviceId: device.id,
        command: command,
        executedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao registrar comando:', error);
    }
  }

  // Lidar com fechamento de conexão
  async handleConnectionClose(sessionId) {
    const connectionInfo = this.connections.get(sessionId);
    
    if (connectionInfo) {
      try {
        // Encerrar cliente SSH se existir
        if (connectionInfo.client) {
          connectionInfo.client.end();
        }
        
        // Registrar encerramento da sessão
        const duration = Math.round((new Date() - connectionInfo.startTime) / 1000);
        
        await AccessLog.create({
          userId: connectionInfo.user.id,
          deviceId: connectionInfo.device.id,
          ipAddress: connectionInfo.ws._socket.remoteAddress,
          accessType: `disconnect-${connectionInfo.protocol}`,
          status: 'success',
          details: `Conexão ${connectionInfo.protocol.toUpperCase()} encerrada para ${connectionInfo.device.name} (duração: ${duration}s)`
        });
        
        // Remover conexão do mapa
        this.connections.delete(sessionId);
        
        console.log(`Sessão ${sessionId} encerrada após ${duration} segundos`);
      } catch (error) {
        console.error(`Erro ao fechar sessão ${sessionId}:`, error);
      }
    }
  }

  // Encerrar todas as conexões
  closeAllConnections() {
    for (const [sessionId, connectionInfo] of this.connections.entries()) {
      try {
        if (connectionInfo.client) {
          connectionInfo.client.end();
        }
        if (connectionInfo.ws && connectionInfo.ws.readyState === WebSocket.OPEN) {
          connectionInfo.ws.close();
        }
      } catch (error) {
        console.error(`Erro ao encerrar sessão ${sessionId}:`, error);
      }
    }
    
    this.connections.clear();
    console.log('Todas as conexões de terminal encerradas');
  }
}

module.exports = new TerminalService();
