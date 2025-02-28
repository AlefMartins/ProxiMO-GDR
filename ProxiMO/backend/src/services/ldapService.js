const ldap = require('ldapjs');
const ActiveDirectory = require('activedirectory2');
const { User, AccessLog, Setting } = require('../database/models');
const { Op } = require('sequelize');

class LdapService {
  constructor() {
    this.client = null;
    this.ad = null;
    this.isInitialized = false;
    this.settings = {};
  }

  // Inicializar o serviço LDAP com configurações do banco de dados
  async initialize() {
    try {
      // Buscar configurações do LDAP do banco de dados
      const ldapSettings = await Setting.findAll({
        where: { category: 'ldap' }
      });

      // Se não houver configurações, não inicializar
      if (!ldapSettings || ldapSettings.length === 0) {
        console.log('Configurações LDAP não encontradas no banco de dados');
        this.isInitialized = false;
        return false;
      }

      // Converter array de configurações para objeto
      const settings = {};
      ldapSettings.forEach(setting => {
        settings[setting.key] = setting.value;
      });

      this.settings = settings;

      // Verificar se as configurações obrigatórias existem
      const requiredSettings = ['ldapUrl', 'bindDN', 'bindCredentials', 'searchBase'];
      for (const setting of requiredSettings) {
        if (!settings[setting]) {
          console.error(`Configuração LDAP obrigatória não encontrada: ${setting}`);
          this.isInitialized = false;
          return false;
        }
      }

      // Configurar cliente LDAP
      this.client = ldap.createClient({
        url: settings.ldapUrl,
        bindDN: settings.bindDN,
        bindCredentials: settings.bindCredentials,
        timeout: parseInt(settings.timeout || '5000'),
        connectTimeout: parseInt(settings.connectTimeout || '10000')
      });

      // Configurar Active Directory se for do tipo AD
      if (settings.isActiveDirectory === 'true') {
        this.ad = new ActiveDirectory({
          url: settings.ldapUrl,
          baseDN: settings.searchBase,
          username: settings.bindDN,
          password: settings.bindCredentials,
          attributes: {
            user: ['sAMAccountName', 'givenName', 'sn', 'mail', 'userPrincipalName', 'memberOf', 'objectSid', 'userAccountControl'],
            group: ['cn', 'dn', 'description']
          }
        });
      }

      // Testar a conexão
      return new Promise((resolve, reject) => {
        this.client.bind(settings.bindDN, settings.bindCredentials, (err) => {
          if (err) {
            console.error('Erro ao conectar ao servidor LDAP:', err);
            this.isInitialized = false;
            reject(err);
            return;
          }

          console.log('Conexão LDAP estabelecida com sucesso');
          this.isInitialized = true;
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Erro ao inicializar serviço LDAP:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Autenticar usuário no LDAP
  async authenticate(username, password) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
        if (!this.isInitialized) {
          throw new Error('Serviço LDAP não inicializado');
        }
      }

      // Se estiver usando Active Directory
      if (this.ad) {
        return new Promise((resolve, reject) => {
          this.ad.authenticate(username, password, (err, auth) => {
            if (err) {
              console.error('Erro na autenticação LDAP (AD):', err);
              reject(err);
              return;
            }

            if (auth) {
              // Buscar informações do usuário
              this.ad.findUser(username, (err, user) => {
                if (err) {
                  console.error('Erro ao buscar usuário no AD:', err);
                  reject(err);
                  return;
                }

                resolve({
                  authenticated: true,
                  user: {
                    username: user.sAMAccountName,
                    fullName: `${user.givenName} ${user.sn}`,
                    email: user.mail || user.userPrincipalName,
                    isLdapUser: true
                  }
                });
              });
            } else {
              resolve({ authenticated: false });
            }
          });
        });
      } 
      // Se for LDAP padrão
      else {
        const userDN = this.settings.userDnPattern.replace('{username}', username);
        
        return new Promise((resolve, reject) => {
          // Tentar autenticar com as credenciais fornecidas
          const authClient = ldap.createClient({
            url: this.settings.ldapUrl,
            timeout: parseInt(this.settings.timeout || '5000'),
            connectTimeout: parseInt(this.settings.connectTimeout || '10000')
          });

          authClient.bind(userDN, password, async (err) => {
            if (err) {
              console.error('Erro na autenticação LDAP:', err);
              authClient.unbind();
              
              // Verificar se é erro de credenciais ou outro tipo
              if (err.code === 49) {
                resolve({ authenticated: false });
              } else {
                reject(err);
              }
              return;
            }

            // Autenticação bem-sucedida, buscar informações do usuário
            const searchOptions = {
              filter: `(${this.settings.userIdAttribute}=${username})`,
              scope: 'sub',
              attributes: [
                this.settings.userIdAttribute,
                this.settings.userFirstNameAttribute || 'givenName',
                this.settings.userLastNameAttribute || 'sn',
                this.settings.userEmailAttribute || 'mail'
              ]
            };

            this.client.search(this.settings.searchBase, searchOptions, (err, res) => {
              if (err) {
                console.error('Erro ao buscar usuário no LDAP:', err);
                authClient.unbind();
                reject(err);
                return;
              }

              let userData = null;

              res.on('searchEntry', (entry) => {
                const user = entry.object;
                userData = {
                  username: user[this.settings.userIdAttribute],
                  fullName: `${user[this.settings.userFirstNameAttribute || 'givenName']} ${user[this.settings.userLastNameAttribute || 'sn']}`,
                  email: user[this.settings.userEmailAttribute || 'mail'],
                  isLdapUser: true
                };
              });

              res.on('error', (err) => {
                console.error('Erro na busca LDAP:', err);
                authClient.unbind();
                reject(err);
              });

              res.on('end', () => {
                authClient.unbind();
                if (userData) {
                  resolve({ authenticated: true, user: userData });
                } else {
                  resolve({ authenticated: false });
                }
              });
            });
          });
        });
      }
    } catch (error) {
      console.error('Erro no serviço de autenticação LDAP:', error);
      throw error;
    }
  }

  // Sincronizar usuários do LDAP com o banco de dados local
  async syncUsers() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
        if (!this.isInitialized) {
          throw new Error('Serviço LDAP não inicializado');
        }
      }

      // Buscar grupos permitidos da configuração
      const allowedGroups = this.settings.allowedGroups ? 
        this.settings.allowedGroups.split(',').map(g => g.trim()) : [];

      // Se estiver usando Active Directory
      if (this.ad) {
        return new Promise((resolve, reject) => {
          // Construir filtro para usuários
          let userFilter = '(&(objectClass=user)(!(objectClass=computer))';
          
          // Adicionar filtro para grupos permitidos, se houver
          if (allowedGroups.length > 0) {
            userFilter += '(|';
            allowedGroups.forEach(group => {
              userFilter += `(memberOf=CN=${group},${this.settings.groupSearchBase || this.settings.searchBase})`;
            });
            userFilter += ')';
          }
          
          userFilter += ')';
          
          // Buscar usuários
          this.ad.findUsers(userFilter, async (err, users) => {
            if (err) {
              console.error('Erro ao buscar usuários no AD:', err);
              reject(err);
              return;
            }

            if (!users || users.length === 0) {
              resolve({ synced: 0, updated: 0, total: 0 });
              return;
            }

            // Contadores para estatísticas
            let synced = 0;
            let updated = 0;

            // Processar cada usuário
            for (const ldapUser of users) {
              try {
                // Verificar se o usuário está ativo no AD
                const isActive = !(ldapUser.userAccountControl & 2); // 2 = ACCOUNTDISABLE

                // Buscar se o usuário já existe no banco
                const [user, created] = await User.findOrCreate({
                  where: { username: ldapUser.sAMAccountName },
                  defaults: {
                    fullName: `${ldapUser.givenName || ''} ${ldapUser.sn || ''}`.trim(),
                    email: ldapUser.mail || ldapUser.userPrincipalName,
                    isLdapUser: true,
                    isActive: isActive,
                    // Gerar senha aleatória para usuários LDAP (não será usada para login)
                    password: Math.random().toString(36).substring(2)
                  }
                });

                if (created) {
                  synced++;
                } else if (user.isLdapUser) {
                  // Atualizar informações se o usuário já existir e for um usuário LDAP
                  await user.update({
                    fullName: `${ldapUser.givenName || ''} ${ldapUser.sn || ''}`.trim(),
                    email: ldapUser.mail || ldapUser.userPrincipalName,
                    isActive: isActive
                  });
                  updated++;
                }
              } catch (userError) {
                console.error(`Erro ao processar usuário ${ldapUser.sAMAccountName}:`, userError);
                // Continuar com o próximo usuário
              }
            }

            resolve({ synced, updated, total: users.length });
          });
        });
      } 
      // Se for LDAP padrão
      else {
        return new Promise((resolve, reject) => {
          // Construir filtro para usuários
          let userFilter = `(&(objectClass=${this.settings.userObjectClass || 'person'})`;
          
          // Adicionar filtro adicional, se configurado
          if (this.settings.userFilter) {
            userFilter += this.settings.userFilter;
          }
          
          userFilter += ')';
          
          const searchOptions = {
            filter: userFilter,
            scope: 'sub',
            attributes: [
              this.settings.userIdAttribute,
              this.settings.userFirstNameAttribute || 'givenName',
              this.settings.userLastNameAttribute || 'sn',
              this.settings.userEmailAttribute || 'mail'
            ]
          };

          // Buscar usuários
          this.client.search(this.settings.searchBase, searchOptions, async (err, res) => {
            if (err) {
              console.error('Erro ao buscar usuários no LDAP:', err);
              reject(err);
              return;
            }

            // Contadores para estatísticas
            let synced = 0;
            let updated = 0;
            let total = 0;
            const users = [];

            res.on('searchEntry', (entry) => {
              users.push(entry.object);
              total++;
            });

            res.on('error', (err) => {
              console.error('Erro na busca LDAP:', err);
              reject(err);
            });

            res.on('end', async () => {
              // Processar cada usuário
              for (const ldapUser of users) {
                try {
                  const username = ldapUser[this.settings.userIdAttribute];
                  
                  // Verificar se o usuário está em um grupo permitido, se necessário
                  if (allowedGroups.length > 0) {
                    // Implementar verificação de grupos aqui se necessário
                    // Para LDAP simples, isso pode requerer busca adicional
                  }

                  // Buscar se o usuário já existe no banco
                  const [user, created] = await User.findOrCreate({
                    where: { username },
                    defaults: {
                      fullName: `${ldapUser[this.settings.userFirstNameAttribute || 'givenName'] || ''} ${ldapUser[this.settings.userLastNameAttribute || 'sn'] || ''}`.trim(),
                      email: ldapUser[this.settings.userEmailAttribute || 'mail'],
                      isLdapUser: true,
                      isActive: true, // Assumir ativo por padrão
                      // Gerar senha aleatória para usuários LDAP (não será usada para login)
                      password: Math.random().toString(36).substring(2)
                    }
                  });

                  if (created) {
                    synced++;
                  } else if (user.isLdapUser) {
                    // Atualizar informações se o usuário já existir e for um usuário LDAP
                    await user.update({
                      fullName: `${ldapUser[this.settings.userFirstNameAttribute || 'givenName'] || ''} ${ldapUser[this.settings.userLastNameAttribute || 'sn'] || ''}`.trim(),
                      email: ldapUser[this.settings.userEmailAttribute || 'mail']
                    });
                    updated++;
                  }
                } catch (userError) {
                  console.error(`Erro ao processar usuário LDAP:`, userError);
                  // Continuar com o próximo usuário
                }
              }

              resolve({ synced, updated, total });
            });
          });
        });
      }
    } catch (error) {
      console.error('Erro na sincronização de usuários LDAP:', error);
      throw error;
    }
  }

    // Verificar status do servidor LDAP
    async checkStatus() {
        try {
          if (!this.isInitialized) {
            await this.initialize();
          }
    
          return new Promise((resolve) => {
            if (!this.isInitialized) {
              resolve({ status: 'offline', message: 'Serviço LDAP não inicializado' });
              return;
            }
    
            this.client.bind(this.settings.bindDN, this.settings.bindCredentials, (err) => {
              if (err) {
                console.error('Erro ao verificar status do servidor LDAP:', err);
                resolve({ 
                  status: 'offline', 
                  message: `Erro na conexão: ${err.message}`,
                  error: err
                });
                return;
              }
    
              // Buscar informações do servidor
              const searchOptions = {
                filter: '(objectClass=*)',
                scope: 'base',
                attributes: ['*']
              };
    
              this.client.search('', searchOptions, (err, res) => {
                if (err) {
                  resolve({ 
                    status: 'degraded', 
                    message: `Conexão OK, mas erro na busca: ${err.message}`,
                    error: err
                  });
                  return;
                }
    
                let serverInfo = {};
                
                res.on('searchEntry', (entry) => {
                  serverInfo = entry.object;
                });
    
                res.on('error', (err) => {
                  resolve({ 
                    status: 'degraded', 
                    message: `Conexão OK, mas erro na busca: ${err.message}`,
                    error: err
                  });
                });
    
                res.on('end', () => {
                  resolve({ 
                    status: 'online', 
                    message: 'Servidor LDAP operacional',
                    serverInfo,
                    config: {
                      url: this.settings.ldapUrl,
                      searchBase: this.settings.searchBase,
                      isActiveDirectory: this.settings.isActiveDirectory === 'true'
                    }
                  });
                });
              });
            });
          });
        } catch (error) {
          console.error('Erro ao verificar status do servidor LDAP:', error);
          return { 
            status: 'error', 
            message: `Erro inesperado: ${error.message}`,
            error
          };
        }
      }
    
      // Buscar grupos LDAP
      async getGroups() {
        try {
          if (!this.isInitialized) {
            await this.initialize();
            if (!this.isInitialized) {
              throw new Error('Serviço LDAP não inicializado');
            }
          }
    
          // Se estiver usando Active Directory
          if (this.ad) {
            return new Promise((resolve, reject) => {
              const groupSearchBase = this.settings.groupSearchBase || this.settings.searchBase;
              
              this.ad.findGroups(groupSearchBase, (err, groups) => {
                if (err) {
                  console.error('Erro ao buscar grupos no AD:', err);
                  reject(err);
                  return;
                }
    
                resolve(groups.map(group => ({
                  name: group.cn,
                  dn: group.dn,
                  description: group.description
                })));
              });
            });
          } 
          // Se for LDAP padrão
          else {
            return new Promise((resolve, reject) => {
              const groupSearchBase = this.settings.groupSearchBase || this.settings.searchBase;
              const groupFilter = `(objectClass=${this.settings.groupObjectClass || 'groupOfNames'})`;
              
              const searchOptions = {
                filter: groupFilter,
                scope: 'sub',
                attributes: [
                  'cn',
                  'description',
                  'member',
                  'memberUid'
                ]
              };
    
              this.client.search(groupSearchBase, searchOptions, (err, res) => {
                if (err) {
                  console.error('Erro ao buscar grupos no LDAP:', err);
                  reject(err);
                  return;
                }
    
                const groups = [];
    
                res.on('searchEntry', (entry) => {
                  const group = entry.object;
                  groups.push({
                    name: group.cn,
                    dn: group.dn,
                    description: group.description,
                    members: group.member || group.memberUid || []
                  });
                });
    
                res.on('error', (err) => {
                  console.error('Erro na busca de grupos LDAP:', err);
                  reject(err);
                });
    
                res.on('end', () => {
                  resolve(groups);
                });
              });
            });
          }
        } catch (error) {
          console.error('Erro ao buscar grupos LDAP:', error);
          throw error;
        }
      }
    
      // Fechar conexão LDAP
      close() {
        if (this.client) {
          this.client.unbind();
          this.client = null;
        }
        this.isInitialized = false;
        console.log('Conexão LDAP fechada');
      }
    }
    
    module.exports = new LdapService();
    