'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Settings', [
      // Configurações gerais
      {
        key: 'systemName',
        value: 'TACACS+ LDAP Manager',
        category: 'general',
        description: 'Nome do sistema',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'logo',
        value: '/images/logo.png',
        category: 'general',
        description: 'Logo do sistema',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'sessionTimeout',
        value: '28800', // 8 horas em segundos
        category: 'general',
        description: 'Tempo limite da sessão em segundos',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Configurações de email
      {
        key: 'smtpServer',
        value: 'smtp.example.com',
        category: 'email',
        description: 'Servidor SMTP para envio de emails',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'smtpPort',
        value: '587',
        category: 'email',
        description: 'Porta do servidor SMTP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'smtpUser',
        value: '',
        category: 'email',
        description: 'Usuário para autenticação SMTP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'smtpPassword',
        value: '',
        category: 'email',
        description: 'Senha para autenticação SMTP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'smtpFrom',
        value: 'no-reply@example.com',
        category: 'email',
        description: 'Endereço de email do remetente',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Configurações de LDAP
      {
        key: 'ldapUrl',
        value: 'ldap://ldap.example.com:389',
        category: 'ldap',
        description: 'URL do servidor LDAP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'bindDN',
        value: 'cn=admin,dc=example,dc=com',
        category: 'ldap',
        description: 'DN para bind no LDAP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'bindCredentials',
        value: '',
        category: 'ldap',
        description: 'Senha para bind no LDAP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'searchBase',
        value: 'dc=example,dc=com',
        category: 'ldap',
        description: 'Base de busca LDAP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'userIdAttribute',
        value: 'uid',
        category: 'ldap',
        description: 'Atributo de identificação do usuário',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'isActiveDirectory',
        value: 'false',
        category: 'ldap',
        description: 'Indica se o LDAP é um Active Directory',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Configurações de TACACS+
      {
        key: 'serverHost',
        value: '127.0.0.1',
        category: 'tacacs',
        description: 'Endereço do servidor TACACS+',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'serverPort',
        value: '49',
        category: 'tacacs',
        description: 'Porta do servidor TACACS+',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'sharedSecret',
        value: '',
        category: 'tacacs',
        description: 'Chave compartilhada TACACS+',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'timeout',
        value: '5000',
        category: 'tacacs',
        description: 'Timeout para conexão TACACS+ (ms)',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Configurações de RADIUS
      {
        key: 'serverHost',
        value: '127.0.0.1',
        category: 'radius',
        description: 'Endereço do servidor RADIUS',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'serverPort',
        value: '1812',
        category: 'radius',
        description: 'Porta de autenticação do servidor RADIUS',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'accountingPort',
        value: '1813',
        category: 'radius',
        description: 'Porta de accounting do servidor RADIUS',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'sharedSecret',
        value: '',
        category: 'radius',
        description: 'Chave compartilhada RADIUS',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'timeout',
        value: '5000',
        category: 'radius',
        description: 'Timeout para conexão RADIUS (ms)',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Configurações do Terminal
      {
        key: 'maxTerminalSessions',
        value: '10',
        category: 'terminal',
        description: 'Número máximo de sessões de terminal simultâneas',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'terminalTimeout',
        value: '1800', // 30 minutos em segundos
        category: 'terminal',
        description: 'Tempo máximo de inatividade no terminal (segundos)',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'defaultTerminalType',
        value: 'xterm-color',
        category: 'terminal',
        description: 'Tipo de terminal padrão',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Settings', null, {});
  }
};
