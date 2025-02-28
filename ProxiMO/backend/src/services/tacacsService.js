const tacacs = require('tacacs-plus');
const { User, AccessLog, Setting, Device } = require('../database/models');

class TacacsService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.settings = {};
  }

  // Inicializar o serviço TACACS+ com configurações do banco de dados
  async initialize() {
    try {
      // Buscar configurações do TACACS+ do banco de dados
      const tacacsSettings = await Setting.findAll({
        where: { category: 'tacacs' }
      });

      // Se não houver configurações, não inicializar
      if (!tacacsSettings || tacacsSettings.length === 0) {
        console.log('Configurações TACACS+ não encontradas no banco de dados');
        this.isInitialized = false;
        return false;
      }

      // Converter array de configurações para objeto
      const settings = {};
      tacacsSettings.forEach(setting => {
        settings[setting.key] = setting.value;
      });

      this.settings = settings;

      // Verificar se as configurações obrigatórias existem
      const requiredSettings = ['serverHost', 'serverPort', 'sharedSecret'];
      for (const setting of requiredSettings) {
        if (!settings[setting]) {
          console.error(`Configuração TACACS+ obrigatória não encontrada: ${setting}`);
          this.isInitialized = false;
          return false;
        }
      }

      // Confirmar inicialização
      this.isInitialized = true;
      console.log('Serviço TACACS+ inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar serviço TACACS+:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Autenticar usuário via TACACS+
  async authenticate(username, password) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
        if (!this.isInitialized) {
          throw new Error('Serviço TACACS+ não inicializado');
        }
      }

      return new Promise((resolve, reject) => {
        const client = new tacacs.Client({
          host: this.settings.serverHost,
          port: parseInt(this.settings.serverPort),
          key: this.settings.sharedSecret,
          timeout: parseInt(this.settings.timeout || '5000')
        });

        client.authenticate({
          username: username,
          password: password,
          remoteAddress: '127.0.0.1', // Endereço local
          source: 'console'           // Fonte da autenticação
        }, (err, result) => {
          if (err) {
            console.error('Erro na autenticação TACACS+:', err);
            reject(err);
            return;
          }

          if (result.isAuthenticated) {
            resolve({ authenticated: true, user: { username } });
          } else {
            resolve({ authenticated: false });
          }
        });
      });
    } catch (error) {
      console.error('Erro no serviço de autenticação TACACS+:', error);
      throw error;
    }
  }

  // Verificar autorização para comando específico
  async authorizeCommand(username, deviceIp, command) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
        if (!this.isInitialized) {
          throw new Error('Serviço TACACS+ não inicializado');
        }
      }

      return new Promise((resolve, reject) => {
        const client = new tacacs.Client({
          host: this.settings.serverHost,
          port: parseInt(this.settings.serverPort),
          key: this.settings.sharedSecret,
          timeout: parseInt(this.settings.timeout || '5000')
        });

        client.authorize({
          username: username,
          args: command.split(' '),
          service: 'shell',
          protocol: 'ssh',
          remoteAddress: deviceIp,
          source: this.settings.applicationName || 'tacacs_ldap_system'
        }, (err, result) => {
          if (err) {
            console.error('Erro na autorização TACACS+:', err);
            reject(err);
            return;
          }

          resolve({
            authorized: result.isAuthorized,
            message: result.message || ''
          });
        });
      });
    } catch (error) {
      console.error('Erro no serviço de autorização TACACS+:', error);
      throw error;
    }
  }

  // Registrar comando executado (accounting)
  async logCommand(username, deviceIp, command, success = true) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
        if (!this.isInitialized) {
          throw new Error('Serviço TACACS+ não inicializado');
        }
      }

      return new Promise((resolve, reject) => {
        const client = new tacacs.Client({
          host: this.settings.serverHost,
          port: parseInt(this.settings.serverPort),
          key: this.settings.sharedSecret,
          timeout: parseInt(this.settings.timeout || '5000')
        });

        client.account({
          username: username,
          args: command.split(' '),
          task_id: Date.now(),
          start: true,
          service: 'shell',
          protocol: 'ssh',
          remoteAddress: deviceIp,
          source: this.settings.applicationName || 'tacacs_ldap_system',
          flags: success ? tacacs.ACCOUNT_FLAG_SUCCESS : tacacs.ACCOUNT_FLAG_FAILURE
        }, (err) => {
          if (err) {
            console.error('Erro no accounting TACACS+:', err);
            reject(err);
            return;
          }

          resolve({ success: true });
        });
      });
    } catch (error) {
      console.error('Erro no serviço de accounting TACACS+:', error);
      throw error;
    }
  }

  // Verificar status do servidor TACACS+
  async checkStatus() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        return { 
          status: 'offline', 
          message: 'Serviço TACACS+ não inicializado' 
        };
      }

      return new Promise((resolve) => {
        const client = new tacacs.Client({
          host: this.settings.serverHost,
          port: parseInt(this.settings.serverPort),
          key: this.settings.sharedSecret,
          timeout: parseInt(this.settings.timeout || '5000')
        });

        // Tentar uma autenticação com usuário de teste para verificar se o servidor está online
        const testUsername = this.settings.testUsername || 'probe';
        const testPassword = this.settings.testPassword || 'probe123';

        client.authenticate({
          username: testUsername,
          password: testPassword,
          remoteAddress: '127.0.0.1',
          source: 'status_check'
        }, (err) => {
          // Aqui só estamos verificando se a conexão funciona, não se a autenticação é bem-sucedida
          if (err && err.code === 'ETIMEDOUT') {
            resolve({ 
              status: 'offline', 
              message: 'Servidor TACACS+ não está respondendo',
              error: err
            });
          } else if (err && err.code === 'ECONNREFUSED') {
            resolve({ 
              status: 'offline', 
              message: 'Conexão recusada pelo servidor TACACS+',
              error: err
            });
          } else if (err) {
            // Se for erro de autenticação, o servidor está online
            resolve({ 
              status: 'online', 
              message: 'Servidor TACACS+ respondeu com erro de autenticação (esperado)',
              config: {
                host: this.settings.serverHost,
                port: this.settings.serverPort
              }
            });
          } else {
            // Se a autenticação foi bem-sucedida (improvável com usuário de teste)
            resolve({ 
              status: 'online', 
              message: 'Servidor TACACS+ operacional',
              config: {
                host: this.settings.serverHost,
                port: this.settings.serverPort
              }
            });
          }
        });
      });
    } catch (error) {
      console.error('Erro ao verificar status do servidor TACACS+:', error);
      return { 
        status: 'error', 
        message: `Erro inesperado: ${error.message}`,
        error
      };
    }
  }
}

module.exports = new TacacsService();
