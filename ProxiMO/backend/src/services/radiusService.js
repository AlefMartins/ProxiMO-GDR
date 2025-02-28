const radius = require('radius');
const dgram = require('dgram');
const { User, AccessLog, Setting, Device } = require('../database/models');

class RadiusService {
  constructor() {
    this.isInitialized = false;
    this.settings = {};
  }

  // Inicializar o serviço RADIUS com configurações do banco de dados
  async initialize() {
    try {
      // Buscar configurações do RADIUS do banco de dados
      const radiusSettings = await Setting.findAll({
        where: { category: 'radius' }
      });

      // Se não houver configurações, não inicializar
      if (!radiusSettings || radiusSettings.length === 0) {
        console.log('Configurações RADIUS não encontradas no banco de dados');
        this.isInitialized = false;
        return false;
      }

      // Converter array de configurações para objeto
      const settings = {};
      radiusSettings.forEach(setting => {
        settings[setting.key] = setting.value;
      });

      this.settings = settings;

      // Verificar se as configurações obrigatórias existem
      const requiredSettings = ['serverHost', 'serverPort', 'sharedSecret'];
      for (const setting of requiredSettings) {
        if (!settings[setting]) {
          console.error(`Configuração RADIUS obrigatória não encontrada: ${setting}`);
          this.isInitialized = false;
          return false;
        }
      }

      // Confirmar inicialização
      this.isInitialized = true;
      console.log('Serviço RADIUS inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar serviço RADIUS:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Autenticar usuário via RADIUS
  async authenticate(username, password) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
        if (!this.isInitialized) {
          throw new Error('Serviço RADIUS não inicializado');
        }
      }

      return new Promise((resolve, reject) => {
        // Criar pacote RADIUS
        const client = dgram.createSocket('udp4');
        
        // Montagem do pacote de autenticação
        const packet = {
          code: 'Access-Request',
          identifier: 1,
          attributes: [
            ['User-Name', username],
            ['User-Password', password],
            ['NAS-IP-Address', '127.0.0.1'],
            ['NAS-Port', 0]
          ]
        };

        // Codificar o pacote
        const encoded = radius.encode({
          code: packet.code,
          identifier: packet.identifier,
          attributes: packet.attributes,
          secret: this.settings.sharedSecret
        });

        // Configurar timeout
        const timeoutMs = parseInt(this.settings.timeout || '5000');
        const timeoutId = setTimeout(() => {
          client.close();
          reject(new Error('Timeout ao aguardar resposta do servidor RADIUS'));
        }, timeoutMs);

        // Enviar pacote
        client.on('message', (msg) => {
          clearTimeout(timeoutId);
          
          // Decodificar resposta
          const response = radius.decode({
            packet: msg,
            secret: this.settings.sharedSecret
          });

          client.close();
          
          // Verificar resposta
          if (response.code === 'Access-Accept') {
            resolve({ 
              authenticated: true, 
              user: { username },
              attributes: response.attributes
            });
          } else {
            resolve({ authenticated: false });
          }
        });

        client.on('error', (err) => {
          clearTimeout(timeoutId);
          client.close();
          reject(err);
        });

        client.send(
          encoded, 
          0, 
          encoded.length, 
          parseInt(this.settings.serverPort), 
          this.settings.serverHost, 
          (err) => {
            if (err) {
              clearTimeout(timeoutId);
              client.close();
              reject(err);
            }
          }
        );
      });
    } catch (error) {
      console.error('Erro no serviço de autenticação RADIUS:', error);
      throw error;
    }
  }

  // Iniciar accounting (registro de sessão)
  async startAccounting(username, deviceIp, sessionId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
        if (!this.isInitialized) {
          throw new Error('Serviço RADIUS não inicializado');
        }
      }

      return this._sendAccountingPacket(username, deviceIp, sessionId, 'Start');
    } catch (error) {
      console.error('Erro ao iniciar accounting RADIUS:', error);
      throw error;
    }
  }

  // Finalizar accounting (registro de sessão)
  async stopAccounting(username, deviceIp, sessionId, sessionDuration) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
        if (!this.isInitialized) {
          throw new Error('Serviço RADIUS não inicializado');
        }
      }

      return this._sendAccountingPacket(username, deviceIp, sessionId, 'Stop', sessionDuration);
    } catch (error) {
      console.error('Erro ao finalizar accounting RADIUS:', error);
      throw error;
    }
  }

  // Método interno para enviar pacotes de accounting
  async _sendAccountingPacket(username, deviceIp, sessionId, status, sessionDuration = 0) {
    return new Promise((resolve, reject) => {
      // Criar pacote RADIUS
      const client = dgram.createSocket('udp4');
      
      // Montagem do pacote de accounting
      const attributes = [
        ['User-Name', username],
        ['NAS-IP-Address', '127.0.0.1'],
        ['NAS-Port', 0],
        ['Acct-Status-Type', status],
        ['Acct-Session-Id', sessionId],
        ['Acct-Authentic', 'RADIUS'],
        ['Calling-Station-Id', deviceIp]
      ];

      // Adicionar duração da sessão se for Stop
      if (status === 'Stop' && sessionDuration > 0) {
        attributes.push(['Acct-Session-Time', sessionDuration]);
      }

      // Codificar o pacote
      const encoded = radius.encode({
        code: 'Accounting-Request',
        identifier: Math.floor(Math.random() * 256),
        attributes: attributes,
        secret: this.settings.sharedSecret
      });

      // Configurar timeout
      const timeoutMs = parseInt(this.settings.timeout || '5000');
      const timeoutId = setTimeout(() => {
        client.close();
        reject(new Error('Timeout ao aguardar resposta do servidor RADIUS'));
      }, timeoutMs);

      // Enviar pacote
      client.on('message', (msg) => {
        clearTimeout(timeoutId);
        
        // Decodificar resposta
        const response = radius.decode({
          packet: msg,
          secret: this.settings.sharedSecret
        });

        client.close();
        
        // Verificar resposta
        if (response.code === 'Accounting-Response') {
          resolve({ success: true });
        } else {
          resolve({ success: false, response });
        }
      });

      client.on('error', (err) => {
        clearTimeout(timeoutId);
        client.close();
        reject(err);
      });

      // Porta de accounting (geralmente porta do servidor + 1)
      const accountingPort = parseInt(this.settings.accountingPort || parseInt(this.settings.serverPort) + 1);

      client.send(
        encoded, 
        0, 
        encoded.length, 
        accountingPort, 
        this.settings.serverHost, 
        (err) => {
          if (err) {
            clearTimeout(timeoutId);
            client.close();
            reject(err);
          }
        }
      );
    });
  }

  // Verificar status do servidor RADIUS
  async checkStatus() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        return { 
          status: 'offline', 
          message: 'Serviço RADIUS não inicializado' 
        };
      }

      return new Promise((resolve) => {
        // Criar pacote RADIUS para teste de status
        const client = dgram.createSocket('udp4');
        
        // Montagem do pacote de autenticação
        const testUsername = this.settings.testUsername || 'probe';
        const testPassword = this.settings.testPassword || 'probe123';
        
        // Criar um pacote de teste
        const packet = {
          code: 'Access-Request',
          identifier: 0,
          attributes: [
            ['User-Name', testUsername],
            ['User-Password', testPassword],
            ['NAS-IP-Address', '127.0.0.1'],
            ['NAS-Port', 0]
          ]
        };

        // Codificar o pacote
        const encoded = radius.encode({
          code: packet.code,
          identifier: packet.identifier,
          attributes: packet.attributes,
          secret: this.settings.sharedSecret
        });

        // Configurar timeout
        const timeoutId = setTimeout(() => {
          client.close();
          resolve({ 
            status: 'offline', 
            message: 'Servidor RADIUS não está respondendo (timeout)'
          });
        }, 3000); // Timeout mais curto para verificação de status

        // Enviar pacote
        client.on('message', (msg) => {
          clearTimeout(timeoutId);
          
          // Decodificar resposta
          try {
            const response = radius.decode({
              packet: msg,
              secret: this.settings.sharedSecret
            });

            client.close();
            
            // Qualquer resposta indica que o servidor está online
            resolve({ 
              status: 'online', 
              message: `Servidor RADIUS respondeu com código: ${response.code}`,
              config: {
                host: this.settings.serverHost,
                port: this.settings.serverPort,
                accountingPort: this.settings.accountingPort || parseInt(this.settings.serverPort) + 1
              }
            });
          } catch (decodeErr) {
            client.close();
            resolve({ 
              status: 'degraded', 
              message: 'Erro ao decodificar resposta do servidor RADIUS',
              error: decodeErr
            });
          }
        });

        client.on('error', (err) => {
          clearTimeout(timeoutId);
          client.close();
          
          // Verificar tipo de erro
          if (err.code === 'ECONNREFUSED') {
            resolve({ 
              status: 'offline', 
              message: 'Conexão recusada pelo servidor RADIUS',
              error: err
            });
          } else {
            resolve({ 
              status: 'error', 
              message: `Erro de conexão: ${err.message}`,
              error: err
            });
          }
        });

        client.send(
          encoded, 
          0, 
          encoded.length, 
          parseInt(this.settings.serverPort), 
          this.settings.serverHost, 
          (err) => {
            if (err) {
              clearTimeout(timeoutId);
              client.close();
              resolve({ 
                status: 'error', 
                message: `Erro ao enviar pacote: ${err.message}`,
                error: err
              });
            }
          }
        );
      });
    } catch (error) {
      console.error('Erro ao verificar status do servidor RADIUS:', error);
      return { 
        status: 'error', 
        message: `Erro inesperado: ${error.message}`,
        error
      };
    }
  }
}

module.exports = new RadiusService();
