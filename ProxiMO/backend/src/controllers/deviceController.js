const { Device, AccessLog, User } = require('../database/models');
const { Op } = require('sequelize');
const ping = require('ping');
const path = require('path');
const fs = require('fs');

// Listar todos os dispositivos
exports.getAllDevices = async (req, res) => {
  try {
    const { search, manufacturer, status } = req.query;
    
    // Construir filtros
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { ipAddress: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (manufacturer) {
      where.manufacturer = manufacturer;
    }
    
    if (status) {
      where.status = status;
    }
    
    const devices = await Device.findAll({
      where,
      order: [['name', 'ASC']]
    });
    
    return res.json(devices);
  } catch (error) {
    console.error('Erro ao buscar dispositivos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter um dispositivo pelo ID
exports.getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const device = await Device.findByPk(id);
    
    if (!device) {
      return res.status(404).json({ message: 'Dispositivo não encontrado' });
    }
    
    return res.json(device);
  } catch (error) {
    console.error('Erro ao buscar dispositivo:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Criar um novo dispositivo
exports.createDevice = async (req, res) => {
  try {
    const { 
      name, ipAddress, port, manufacturer, model, 
      supportsSsh, supportsTelnet, supportsWinbox 
    } = req.body;
    
    // Validar entradas
    if (!name || !ipAddress || !port) {
      return res.status(400).json({ message: 'Nome, endereço IP e porta são obrigatórios' });
    }
    
    // Verificar se já existe um dispositivo com o mesmo IP
    const existingDevice = await Device.findOne({ where: { ipAddress } });
    if (existingDevice) {
      return res.status(400).json({ message: 'Já existe um dispositivo com este endereço IP' });
    }
    
    // Verificar disponibilidade do dispositivo
    const pingResult = await ping.promise.probe(ipAddress);
    const status = pingResult.alive ? 'online' : 'offline';
    
    // Criar dispositivo
    const device = await Device.create({
      name,
      ipAddress,
      port,
      manufacturer: manufacturer || 'Desconhecido',
      model: model || 'Desconhecido',
      status,
      supportsSsh: supportsSsh || false,
      supportsTelnet: supportsTelnet || false,
      supportsWinbox: supportsWinbox || false,
      lastPing: pingResult.time,
      lastSeen: pingResult.alive ? new Date() : null
    });
    
    // Registrar log de acesso
    await AccessLog.create({
      userId: req.user.id,
      ipAddress: req.ip,
      accessType: 'create-device',
      status: 'success',
      details: `Dispositivo criado: ${name} (${ipAddress})`
    });
    
    return res.status(201).json(device);
  } catch (error) {
    console.error('Erro ao criar dispositivo:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
// Atualizar um dispositivo
exports.updateDevice = async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        name, ipAddress, port, manufacturer, model, 
        supportsSsh, supportsTelnet, supportsWinbox 
      } = req.body;
      
      // Buscar dispositivo
      const device = await Device.findByPk(id);
      
      if (!device) {
        return res.status(404).json({ message: 'Dispositivo não encontrado' });
      }
      
      // Verificar se o IP está sendo alterado e se já existe outro dispositivo com o mesmo IP
      if (ipAddress && ipAddress !== device.ipAddress) {
        const existingDevice = await Device.findOne({ 
          where: { 
            ipAddress,
            id: { [Op.ne]: id }
          } 
        });
        
        if (existingDevice) {
          return res.status(400).json({ message: 'Já existe um dispositivo com este endereço IP' });
        }
      }
      
      // Atualizar dispositivo
      await device.update({
        name: name || device.name,
        ipAddress: ipAddress || device.ipAddress,
        port: port || device.port,
        manufacturer: manufacturer || device.manufacturer,
        model: model || device.model,
        supportsSsh: supportsSsh !== undefined ? supportsSsh : device.supportsSsh,
        supportsTelnet: supportsTelnet !== undefined ? supportsTelnet : device.supportsTelnet,
        supportsWinbox: supportsWinbox !== undefined ? supportsWinbox : device.supportsWinbox
      });
      
      // Registrar log de acesso
      await AccessLog.create({
        userId: req.user.id,
        deviceId: device.id,
        ipAddress: req.ip,
        accessType: 'update-device',
        status: 'success',
        details: `Dispositivo atualizado: ${device.name} (${device.ipAddress})`
      });
      
      return res.json(device);
    } catch (error) {
      console.error('Erro ao atualizar dispositivo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Excluir um dispositivo
  exports.deleteDevice = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Buscar dispositivo
      const device = await Device.findByPk(id);
      
      if (!device) {
        return res.status(404).json({ message: 'Dispositivo não encontrado' });
      }
      
      // Guardar informações para o log
      const deviceInfo = `${device.name} (${device.ipAddress})`;
      
      // Excluir dispositivo
      await device.destroy();
      
      // Registrar log de acesso
      await AccessLog.create({
        userId: req.user.id,
        ipAddress: req.ip,
        accessType: 'delete-device',
        status: 'success',
        details: `Dispositivo excluído: ${deviceInfo}`
      });
      
      return res.json({ message: 'Dispositivo excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir dispositivo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Verificar status de um dispositivo (ping)
  exports.checkDeviceStatus = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Buscar dispositivo
      const device = await Device.findByPk(id);
      
      if (!device) {
        return res.status(404).json({ message: 'Dispositivo não encontrado' });
      }
      
      // Realizar ping
      const pingResult = await ping.promise.probe(device.ipAddress);
      
      // Atualizar status do dispositivo
      await device.update({
        status: pingResult.alive ? 'online' : 'offline',
        lastPing: pingResult.time,
        lastSeen: pingResult.alive ? new Date() : device.lastSeen
      });
      
      return res.json({
        id: device.id,
        name: device.name,
        ipAddress: device.ipAddress,
        status: device.status,
        lastPing: pingResult.time,
        pingDetails: pingResult
      });
    } catch (error) {
      console.error('Erro ao verificar status do dispositivo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Obter histórico de acesso a um dispositivo
  exports.getDeviceAccessHistory = async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 10, offset = 0 } = req.query;
      
      // Buscar dispositivo
      const device = await Device.findByPk(id);
      
      if (!device) {
        return res.status(404).json({ message: 'Dispositivo não encontrado' });
      }
      
      // Buscar logs de acesso
      const logs = await AccessLog.findAndCountAll({
        where: { deviceId: id },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'fullName']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return res.json({
        total: logs.count,
        offset: parseInt(offset),
        limit: parseInt(limit),
        logs: logs.rows
      });
    } catch (error) {
      console.error('Erro ao buscar histórico de acesso:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  // Checar status de todos os dispositivos
exports.checkAllDevicesStatus = async (req, res) => {
    try {
      // Buscar todos os dispositivos
      const devices = await Device.findAll();
      
      // Array para armazenar os resultados
      const results = [];
      
      // Verificar status de cada dispositivo
      for (const device of devices) {
        try {
          const pingResult = await ping.promise.probe(device.ipAddress);
          const newStatus = pingResult.alive ? 'online' : 'offline';
          
          // Detectar mudança de status
          const statusChanged = device.status !== newStatus;
          
          // Atualizar dispositivo
          await device.update({
            status: newStatus,
            lastPing: pingResult.time,
            lastSeen: pingResult.alive ? new Date() : device.lastSeen
          });
          
          results.push({
            id: device.id,
            name: device.name,
            ipAddress: device.ipAddress,
            status: newStatus,
            lastPing: pingResult.time,
            statusChanged
          });
        } catch (err) {
          console.error(`Erro ao verificar status de ${device.name}:`, err);
          results.push({
            id: device.id,
            name: device.name,
            ipAddress: device.ipAddress,
            status: 'unknown',
            error: err.message
          });
        }
      }
      
      return res.json(results);
    } catch (error) {
      console.error('Erro ao verificar status dos dispositivos:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Upload de imagem para o dispositivo
  exports.uploadDeviceImage = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se o arquivo foi enviado
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }
      
      // Buscar dispositivo
      const device = await Device.findByPk(id);
      
      if (!device) {
        return res.status(404).json({ message: 'Dispositivo não encontrado' });
      }
      
      // Atualizar URL da imagem
      await device.update({
        imageUrl: `/uploads/devices/${req.file.filename}`
      });
      
      return res.json({
        message: 'Imagem atualizada com sucesso',
        imageUrl: device.imageUrl
      });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  // Conectar via SSH ou Telnet
exports.connectToDevice = async (req, res) => {
    try {
      const { id } = req.params;
      const { protocol } = req.query; // 'ssh' ou 'telnet'
      
      // Buscar dispositivo
      const device = await Device.findByPk(id);
      
      if (!device) {
        return res.status(404).json({ message: 'Dispositivo não encontrado' });
      }
      
      // Verificar se o dispositivo suporta o protocolo
      if (protocol === 'ssh' && !device.supportsSsh) {
        return res.status(400).json({ message: 'Este dispositivo não suporta SSH' });
      }
      
      if (protocol === 'telnet' && !device.supportsTelnet) {
        return res.status(400).json({ message: 'Este dispositivo não suporta Telnet' });
      }
      
      // Verificar se o dispositivo está online
      if (device.status !== 'online') {
        return res.status(400).json({ message: 'O dispositivo não está online' });
      }
      
      // Registrar tentativa de acesso
      await AccessLog.create({
        userId: req.user.id,
        deviceId: device.id,
        ipAddress: req.ip,
        accessType: `connect-${protocol}`,
        status: 'attempt',
        details: `Tentativa de conexão ${protocol.toUpperCase()} para ${device.name} (${device.ipAddress})`
      });
      
      // Aqui retornamos apenas as informações para o frontend iniciar a conexão via WebSocket
      // A lógica real de conexão será implementada no serviço de terminal
      return res.json({
        device: {
          id: device.id,
          name: device.name,
          ipAddress: device.ipAddress,
          port: device.port
        },
        protocol,
        // Token temporário para autenticação WebSocket
        connectionToken: `${req.user.id}_${device.id}_${Date.now()}`
      });
    } catch (error) {
      console.error('Erro ao iniciar conexão com o dispositivo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Conectar via Winbox (Mikrotik)
  exports.connectWinbox = async (req, res) => {
    try {
      const { id } = req.params;
      const { method = 'protocol' } = req.query; // 'protocol', 'download', 'launch'
      
      // Buscar dispositivo
      const device = await Device.findByPk(id);
      
      if (!device) {
        return res.status(404).json({ message: 'Dispositivo não encontrado' });
      }
      
      // Verificar se o dispositivo suporta Winbox
      if (!device.supportsWinbox) {
        return res.status(400).json({ message: 'Este dispositivo não suporta Winbox' });
      }
      
      // Verificar se o dispositivo é Mikrotik
      if (device.manufacturer.toLowerCase() !== 'mikrotik') {
        return res.status(400).json({ message: 'Winbox só é compatível com dispositivos Mikrotik' });
      }
      
      // Registrar tentativa de acesso
      await AccessLog.create({
        userId: req.user.id,
        deviceId: device.id,
        ipAddress: req.ip,
        accessType: 'connect-winbox',
        status: 'attempt',
        details: `Tentativa de conexão Winbox para ${device.name} (${device.ipAddress}) via ${method}`
      });
      
      // Obter informações do usuário
      const user = await User.findByPk(req.user.id);
      
      // Resposta com base no método solicitado
      if (method === 'protocol') {
        // Usar protocolo winbox://
        const winboxUrl = `winbox://${device.ipAddress}:${device.port}`;
        
        return res.json({
          device: {
            id: device.id,
            name: device.name,
            ipAddress: device.ipAddress,
            port: device.port
          },
          winboxUrl,
          method: 'protocol'
        });
      } 
      else if (method === 'download') {
        // Fornecer link para download do Winbox
        // Os links para as versões mais recentes do Winbox
        const winboxVersions = {
          win64: 'https://mt.lv/winbox64',  // 64-bit Windows
          win32: 'https://mt.lv/winbox',    // 32-bit Windows
          wine: 'https://mt.lv/winbox',     // Linux via Wine
          mac: 'https://mt.lv/winbox64'     // MacOS
        };
        
        return res.json({
          device: {
            id: device.id,
            name: device.name,
            ipAddress: device.ipAddress,
            port: device.port
          },
          downloadLinks: winboxVersions,
          method: 'download',
          // Credenciais salvas do usuário (caso existam)
          credentials: {
            username: user.username,
            // Não envie a senha real, apenas indique se existe
            hasPassword: true
          }
        });
      }
      else if (method === 'launch') {
        // Para abordagem com executável local
        // Gerar um arquivo de configuração temporário para o Winbox com os dados pré-preenchidos
        const winboxConfigDir = path.join(__dirname, '../../uploads/winbox-configs');
        
        // Garantir que o diretório exista
        if (!fs.existsSync(winboxConfigDir)) {
          fs.mkdirSync(winboxConfigDir, { recursive: true });
        }
        
        // Criar um arquivo de configuração único para este acesso
        const configFileName = `winbox_${req.user.id}_${device.id}_${Date.now()}.cfg`;
        const configFilePath = path.join(winboxConfigDir, configFileName);
        
        // Configuração básica do Winbox - formato simplificado
        const configContent = `
  [connection]
  ip=${device.ipAddress}
  port=${device.port}
  username=${user.username}
  `;
        
        // Salvar o arquivo de configuração
        fs.writeFileSync(configFilePath, configContent);
        
        return res.json({
          device: {
            id: device.id,
            name: device.name,
            ipAddress: device.ipAddress,
            port: device.port
          },
          method: 'launch',
          configFile: `/api/winbox-configs/${configFileName}`,
          // URL alternativa usando o protocolo
          winboxUrl: `winbox://${device.ipAddress}:${device.port}`
        });
      }
      else {
        return res.status(400).json({ message: 'Método de conexão inválido' });
      }
    } catch (error) {
      console.error('Erro ao iniciar conexão Winbox:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  module.exports = exports;
