const { User, Group, AccessLog } = require('../database/models');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const ldapService = require('../services/ldapService');
const tacacsService = require('../services/tacacsService');
const radiusService = require('../services/radiusService');

// Login de usuário
exports.login = async (req, res) => {
  try {
    const { username, password, authType = 'local' } = req.body;

    // Validar entradas
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
    }

    let authenticated = false;
    let userData = null;

    // Autenticar com base no tipo de autenticação
    switch (authType) {
      case 'ldap':
        try {
          const ldapResult = await ldapService.authenticate(username, password);
          
          if (ldapResult.authenticated) {
            authenticated = true;
            userData = ldapResult.user;
            
            // Atualizar ou criar usuário local
            const [user, created] = await User.findOrCreate({
              where: { username: userData.username },
              defaults: {
                fullName: userData.fullName,
                email: userData.email,
                isLdapUser: true,
                isActive: true,
                // Gerar senha aleatória para usuários LDAP (não será usada para login)
                password: Math.random().toString(36).substring(2)
              }
            });
            
            if (!created && user.isLdapUser) {
              // Atualizar informações do usuário LDAP
              await user.update({
                fullName: userData.fullName,
                email: userData.email,
                isActive: true
              });
            }
            
            userData.id = user.id;
            userData.groupId = user.groupId;
          }
        } catch (ldapError) {
          console.error('Erro na autenticação LDAP:', ldapError);
          return res.status(500).json({ message: 'Erro na autenticação LDAP' });
        }
        break;
        
      case 'tacacs':
        try {
          const tacacsResult = await tacacsService.authenticate(username, password);
          
          if (tacacsResult.authenticated) {
            authenticated = true;
            
            // Buscar usuário no banco de dados
            const user = await User.findOne({ where: { username } });
            
            if (user) {
              userData = {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                groupId: user.groupId
              };
            } else {
              return res.status(401).json({ message: 'Usuário autenticado no TACACS+ mas não existe no sistema' });
            }
          }
        } catch (tacacsError) {
          console.error('Erro na autenticação TACACS+:', tacacsError);
          return res.status(500).json({ message: 'Erro na autenticação TACACS+' });
        }
        break;
        
      case 'radius':
        try {
          const radiusResult = await radiusService.authenticate(username, password);
          
          if (radiusResult.authenticated) {
            authenticated = true;
            
            // Buscar usuário no banco de dados
            const user = await User.findOne({ where: { username } });
            
            if (user) {
              userData = {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                groupId: user.groupId
              };
            } else {
              return res.status(401).json({ message: 'Usuário autenticado no RADIUS mas não existe no sistema' });
            }
          }
        } catch (radiusError) {
          console.error('Erro na autenticação RADIUS:', radiusError);
          return res.status(500).json({ message: 'Erro na autenticação RADIUS' });
        }
        break;
        
      case 'local':
      default:
        // Buscar usuário no banco de dados
        const user = await User.findOne({ 
          where: { username },
          include: [{ model: Group, attributes: ['name', 'permissions'] }]
        });

        // Verificar se o usuário existe
        if (!user) {
          return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Verificar se o usuário está ativo
        if (!user.isActive) {
          return res.status(401).json({ message: 'Usuário desativado' });
        }

        // Verificar senha
        const isPasswordValid = await user.checkPassword(password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        authenticated = true;
        userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          groupId: user.groupId,
          group: user.Group ? user.Group.name : null,
          permissions: user.Group ? user.Group.permissions : null
        };
        break;
    }

    // Se a autenticação falhou
    if (!authenticated || !userData) {
      // Registrar tentativa de login falha
      await AccessLog.create({
        userId: null,
        ipAddress: req.ip,
        accessType: 'login',
        status: 'failure',
        details: `Tentativa de login falha: ${username} (método: ${authType})`
      });
      
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Buscar detalhes completos do usuário se não foram buscados ainda
    let userDetails;
    if (!userData.group) {
      userDetails = await User.findByPk(userData.id, {
        include: [{ model: Group, attributes: ['name', 'permissions'] }]
      });
      
      if (userDetails && userDetails.Group) {
        userData.group = userDetails.Group.name;
        userData.permissions = userDetails.Group.permissions;
      }
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: userData.id, 
        username: userData.username,
        groupId: userData.groupId
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );

    // Armazenar token no Redis para controle de sessão
    await redisClient.set(`token:${userData.id}`, token, 'EX', 60 * 60 * 8); // 8 horas

    // Atualizar último login
    await User.update(
      { lastLogin: new Date() },
      { where: { id: userData.id } }
    );

    // Registrar login bem-sucedido
    await AccessLog.create({
      userId: userData.id,
      ipAddress: req.ip,
      accessType: 'login',
      status: 'success',
      details: `Login bem-sucedido: ${username} (método: ${authType})`
    });

    // Responder com token e dados do usuário
    return res.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Logout de usuário
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Remover token do Redis
    await redisClient.del(`token:${userId}`);
    
    // Registrar logout
    await AccessLog.create({
      userId,
      ipAddress: req.ip,
      accessType: 'logout',
      status: 'success',
      details: `Logout: ${req.user.username}`
    });
    
    return res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter informações do usuário atual
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      include: [{ model: Group, attributes: ['name', 'permissions'] }],
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      isLdapUser: user.isLdapUser,
      lastLogin: user.lastLogin,
      group: user.Group ? user.Group.name : null,
      permissions: user.Group ? user.Group.permissions : null
    });
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Verificar status dos serviços de autenticação
exports.checkAuthServices = async (req, res) => {
  try {
    // Verificar se o usuário tem permissão
    // Aqui você pode implementar uma verificação de permissão
    
    // Verificar status dos serviços
    const results = {
      ldap: await ldapService.checkStatus(),
      tacacs: await tacacsService.checkStatus(),
      radius: await radiusService.checkStatus()
    };
    
    return res.json(results);
  } catch (error) {
    console.error('Erro ao verificar serviços de autenticação:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Sincronizar usuários LDAP
exports.syncLdapUsers = async (req, res) => {
  try {
    // Verificar se o usuário tem permissão
    // Aqui você pode implementar uma verificação de permissão
    
    // Sincronizar usuários
    const result = await ldapService.syncUsers();
    
    // Registrar na auditoria
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'ldap-sync',
      status: 'success',
      details: `Sincronização LDAP: ${result.synced} novos, ${result.updated} atualizados, ${result.total} total`
    });
    
    return res.json(result);
  } catch (error) {
    console.error('Erro na sincronização LDAP:', error);
    
    // Registrar erro
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'ldap-sync',
      status: 'failure',
      details: `Erro na sincronização LDAP: ${error.message}`
    });
    
    return res.status(500).json({ message: 'Erro na sincronização LDAP' });
  }
};
