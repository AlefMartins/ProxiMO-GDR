const { Setting, AccessLog } = require('../database/models');
const { Op } = require('sequelize');
const ldapService = require('../services/ldapService');
const tacacsService = require('../services/tacacsService');
const radiusService = require('../services/radiusService');

// Obter todas as configurações
exports.getAllSettings = async (req, res) => {
  try {
    const { category } = req.query;
    
    const where = {};
    if (category) {
      where.category = category;
    }
    
    const settings = await Setting.findAll({
      where,
      order: [['category', 'ASC'], ['key', 'ASC']]
    });
    
    // Agrupar configurações por categoria
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      
      // Omitir valores sensíveis
      if (setting.key.toLowerCase().includes('password') || 
          setting.key.toLowerCase().includes('secret') ||
          setting.key.toLowerCase().includes('credentials')) {
        acc[setting.category].push({
          ...setting.toJSON(),
          value: '******',
          isSensitive: true
        });
      } else {
        acc[setting.category].push(setting);
      }
      
      return acc;
    }, {});
    
    return res.json(groupedSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter configurações por categoria
exports.getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const settings = await Setting.findAll({
      where: { category },
      order: [['key', 'ASC']]
    });
    
    // Processar valores sensíveis
    const processedSettings = settings.map(setting => {
      if (setting.key.toLowerCase().includes('password') || 
          setting.key.toLowerCase().includes('secret') ||
          setting.key.toLowerCase().includes('credentials')) {
        return {
          ...setting.toJSON(),
          value: '******',
          isSensitive: true
        };
      }
      return setting;
    });
    
    return res.json(processedSettings);
  } catch (error) {
    console.error(`Erro ao buscar configurações da categoria ${req.params.category}:`, error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar configurações por categoria
exports.updateSettings = async (req, res) => {
  try {
    const { category } = req.params;
    const settings = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: 'O corpo da requisição deve ser um array de configurações' });
    }
    
    // Iniciar transação
    const result = await Setting.sequelize.transaction(async (transaction) => {
      const updatedSettings = [];
      
      // Processar cada configuração
      for (const setting of settings) {
        // Verificar se os campos obrigatórios existem
        if (!setting.key) {
          throw new Error('Todas as configurações devem ter uma chave (key)');
        }
        
        // Se o valor for "******", manter o valor atual (usado para senhas)
        if (setting.value === '******') {
          const currentSetting = await Setting.findOne({
            where: { category, key: setting.key },
            transaction
          });
          
          if (currentSetting) {
            setting.value = currentSetting.value;
          } else {
            throw new Error(`Configuração sensível ${setting.key} não existe atualmente`);
          }
        }
        
        // Atualizar ou criar a configuração
        const [updatedSetting, created] = await Setting.upsert({
          category,
          key: setting.key,
          value: setting.value,
          description: setting.description
        }, { transaction, returning: true });
        
        updatedSettings.push({
          ...updatedSetting.toJSON(),
          created
        });
      }
      
      return updatedSettings;
    });
    
    // Registrar a ação
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'update-settings',
      status: 'success',
      details: `Configurações atualizadas: categoria ${category}`
    });
    
    // Reinicializar os serviços se necessário
    if (category === 'ldap') {
      await ldapService.initialize();
    } else if (category === 'tacacs') {
      await tacacsService.initialize();
    } else if (category === 'radius') {
      await radiusService.initialize();
    }
    
    return res.json({
      message: `Configurações da categoria ${category} atualizadas com sucesso`,
      settings: result.map(setting => {
        // Omitir valores sensíveis na resposta
        if (setting.key.toLowerCase().includes('password') || 
            setting.key.toLowerCase().includes('secret') ||
            setting.key.toLowerCase().includes('credentials')) {
          return {
            ...setting,
            value: '******',
            isSensitive: true
          };
        }
        return setting;
      })
    });
  } catch (error) {
    console.error(`Erro ao atualizar configurações da categoria ${req.params.category}:`, error);
    
    // Registrar falha
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'update-settings',
      status: 'failure',
      details: `Erro ao atualizar configurações: categoria ${req.params.category} - ${error.message}`
    });
    
    return res.status(500).json({ message: `Erro ao atualizar configurações: ${error.message}` });
  }
};

// Excluir uma configuração específica
exports.deleteSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    
    // Verificar se a configuração existe
    const setting = await Setting.findOne({
      where: { category, key }
    });
    
    if (!setting) {
      return res.status(404).json({ message: `Configuração ${key} não encontrada na categoria ${category}` });
    }
    
    // Excluir a configuração
    await setting.destroy();
    
    // Registrar a ação
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'delete-setting',
      status: 'success',
      details: `Configuração excluída: ${category}.${key}`
    });
    
    // Reinicializar os serviços se necessário
    if (category === 'ldap') {
      await ldapService.initialize();
    } else if (category === 'tacacs') {
      await tacacsService.initialize();
    } else if (category === 'radius') {
      await radiusService.initialize();
    }
    
    return res.json({ message: `Configuração ${key} excluída com sucesso da categoria ${category}` });
  } catch (error) {
    console.error(`Erro ao excluir configuração ${req.params.key} da categoria ${req.params.category}:`, error);
    
    // Registrar falha
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'delete-setting',
      status: 'failure',
      details: `Erro ao excluir configuração: ${req.params.category}.${req.params.key} - ${error.message}`
    });
    
    return res.status(500).json({ message: `Erro ao excluir configuração: ${error.message}` });
  }
};

// Testar configurações de LDAP
exports.testLdapSettings = async (req, res) => {
  try {
    // Reinicializar o serviço LDAP com as configurações atuais
    await ldapService.initialize();
    
    // Verificar status
    const status = await ldapService.checkStatus();
    
    // Registrar a ação
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'test-ldap',
      status: status.status === 'online' ? 'success' : 'failure',
      details: `Teste de configurações LDAP: ${status.message}`
    });
    
    return res.json(status);
  } catch (error) {
    console.error('Erro ao testar configurações LDAP:', error);
    
    // Registrar falha
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'test-ldap',
      status: 'failure',
      details: `Erro ao testar configurações LDAP: ${error.message}`
    });
    
    return res.status(500).json({ 
      status: 'error', 
      message: `Erro ao testar configurações LDAP: ${error.message}` 
    });
  }
};

// Testar configurações de TACACS+
exports.testTacacsSettings = async (req, res) => {
  try {
    // Reinicializar o serviço TACACS+ com as configurações atuais
    await tacacsService.initialize();
    
    // Verificar status
    const status = await tacacsService.checkStatus();
    
    // Registrar a ação
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'test-tacacs',
      status: status.status === 'online' ? 'success' : 'failure',
      details: `Teste de configurações TACACS+: ${status.message}`
    });
    
    return res.json(status);
  } catch (error) {
    console.error('Erro ao testar configurações TACACS+:', error);
    
    // Registrar falha
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'test-tacacs',
      status: 'failure',
      details: `Erro ao testar configurações TACACS+: ${error.message}`
    });
    
    return res.status(500).json({ 
      status: 'error', 
      message: `Erro ao testar configurações TACACS+: ${error.message}` 
    });
  }
};

// Testar configurações de RADIUS
exports.testRadiusSettings = async (req, res) => {
  try {
    // Reinicializar o serviço RADIUS com as configurações atuais
    await radiusService.initialize();
    
    // Verificar status
    const status = await radiusService.checkStatus();
    
    // Registrar a ação
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'test-radius',
      status: status.status === 'online' ? 'success' : 'failure',
      details: `Teste de configurações RADIUS: ${status.message}`
    });
    
    return res.json(status);
  } catch (error) {
    console.error('Erro ao testar configurações RADIUS:', error);
    
    // Registrar falha
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'test-radius',
      status: 'failure',
      details: `Erro ao testar configurações RADIUS: ${error.message}`
    });
    
    return res.status(500).json({ 
      status: 'error', 
      message: `Erro ao testar configurações RADIUS: ${error.message}` 
    });
  }
};
