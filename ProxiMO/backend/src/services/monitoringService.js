const os = require('os');
const { Device, User, AccessLog } = require('../database/models');
const { Sequelize, Op } = require('sequelize');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const ping = require('ping');

class MonitoringService {
  // Obter estatísticas do sistema
  async getSystemStats() {
    try {
      // Informações de CPU
      const cpuInfo = os.cpus();
      const cpuCount = cpuInfo.length;
      
      // Carga de CPU
      let cpuLoad;
      try {
        // Tentativa de obter carga mais precisa em sistemas Linux
        const { stdout } = await exec("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'");
        cpuLoad = parseFloat(stdout.trim());
      } catch (err) {
        // Fallback usando Node.js
        cpuLoad = os.loadavg()[0] * 100 / cpuCount;
      }
      
      // Informações de memória
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsage = (usedMem / totalMem) * 100;
      
      // Informações de disco
      let diskInfo;
      try {
        // Tentar obter informações do disco em sistemas Linux
        const { stdout } = await exec("df -h / | tail -1 | awk '{print $2,$3,$4,$5}'");
        const [total, used, free, percentage] = stdout.trim().split(' ');
        diskInfo = { total, used, free, percentage };
      } catch (err) {
        // Informações básicas caso não consiga executar o comando
        diskInfo = { error: 'Não foi possível obter informações do disco' };
      }
      
      // Informações do sistema
      const sysInfo = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        uptime: os.uptime()
      };
      
      return {
        cpu: {
          count: cpuCount,
          model: cpuInfo[0].model,
          load: cpuLoad.toFixed(2)
        },
        memory: {
          total: totalMem,
          free: freeMem,
          used: usedMem,
          usage: memUsage.toFixed(2)
        },
        disk: diskInfo,
        system: sysInfo,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do sistema:', error);
      throw error;
    }
  }
  
  // Obter estatísticas de usuários
  async getUserStats() {
    try {
      // Total de usuários
      const totalUsers = await User.count();
      
      // Usuários ativos
      const activeUsers = await User.count({ where: { isActive: true } });
      
      // Usuários LDAP
      const ldapUsers = await User.count({ where: { isLdapUser: true } });
      
      // Usuários locais
      const localUsers = await User.count({ where: { isLdapUser: false } });
      
      // Usuários que fizeram login hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const loginsToday = await AccessLog.count({
        where: {
          accessType: 'login',
          status: 'success',
          createdAt: { [Op.gte]: today }
        },
        distinct: true,
        col: 'userId'
      });
      
      // Últimos usuários logados
      const recentLogins = await AccessLog.findAll({
        where: {
          accessType: 'login',
          status: 'success'
        },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      return {
        total: totalUsers,
        active: activeUsers,
        ldap: ldapUsers,
        local: localUsers,
        loginsToday,
        recentLogins,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de usuários:', error);
      throw error;
    }
  }
  
  // Obter estatísticas de dispositivos
  async getDeviceStats() {
    try {
      // Total de dispositivos
      const totalDevices = await Device.count();
      
      // Dispositivos online
      const onlineDevices = await Device.count({ where: { status: 'online' } });
      
      // Dispositivos offline
      const offlineDevices = await Device.count({ where: { status: 'offline' } });
      
      // Dispositivos por fabricante
      const devicesByManufacturer = await Device.findAll({
        attributes: [
          'manufacturer',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['manufacturer'],
        order: [[Sequelize.literal('count'), 'DESC']]
      });
      
      // Dispositivos recentemente acessados
      const recentlyAccessedDevices = await AccessLog.findAll({
        attributes: ['deviceId'],
        include: [
          {
            model: Device,
            attributes: ['id', 'name', 'ipAddress', 'status']
          }
        ],
        where: {
          deviceId: { [Op.ne]: null }
        },
        order: [['createdAt', 'DESC']],
        limit: 5,
        group: ['deviceId']
      });
      
      return {
        total: totalDevices,
        online: onlineDevices,
        offline: offlineDevices,
        byManufacturer: devicesByManufacturer,
        recentlyAccessed: recentlyAccessedDevices,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de dispositivos:', error);
      throw error;
    }
  }
  
  // Obter estatísticas de acessos
  async getAccessStats(period = 'day') {
    try {
      // Definir início do período
      let startDate;
      const now = new Date();
      
      switch (period) {
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
      }
      
      // Total de acessos no período
      const totalAccesses = await AccessLog.count({
        where: {
          createdAt: { [Op.gte]: startDate }
        }
      });
      
      // Acessos bem-sucedidos
      const successfulAccesses = await AccessLog.count({
        where: {
          status: 'success',
          createdAt: { [Op.gte]: startDate }
        }
      });
      
      // Acessos falhos
      const failedAccesses = await AccessLog.count({
        where: {
          status: 'failure',
          createdAt: { [Op.gte]: startDate }
        }
      });
      
      // Acessos por tipo
      const accessesByType = await AccessLog.findAll({
        attributes: [
          'accessType',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.gte]: startDate }
        },
        group: ['accessType'],
        order: [[Sequelize.literal('count'), 'DESC']]
      });
      
      // Acessos por usuário
      const accessesByUser = await AccessLog.findAll({
        attributes: [
          'userId',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        include: [
          {
            model: User,
            attributes: ['username', 'fullName']
          }
        ],
        where: {
          createdAt: { [Op.gte]: startDate }
        },
        group: ['userId'],
        order: [[Sequelize.literal('count'), 'DESC']],
        limit: 5
      });
      
      // Acessos por dispositivo
      const accessesByDevice = await AccessLog.findAll({
        attributes: [
          'deviceId',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        include: [
          {
            model: Device,
            attributes: ['name', 'ipAddress']
          }
        ],
        where: {
          deviceId: { [Op.ne]: null },
          createdAt: { [Op.gte]: startDate }
        },
        group: ['deviceId'],
        order: [[Sequelize.literal('count'), 'DESC']],
        limit: 5
      });
      
      // Acessos por dia (para gráfico)
      let accessesByTimeGroup;
      let timeFormat;
      
      if (period === 'day') {
        // Agrupar por hora
        timeFormat = '%Y-%m-%d %H:00:00';
      } else if (period === 'week') {
        // Agrupar por dia
        timeFormat = '%Y-%m-%d';
      } else if (period === 'month') {
        // Agrupar por dia
        timeFormat = '%Y-%m-%d';
      } else {
        // Agrupar por mês
        timeFormat = '%Y-%m';
      }
      
      accessesByTimeGroup = await AccessLog.findAll({
        attributes: [
          [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), timeFormat), 'timeGroup'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.gte]: startDate }
        },
        group: ['timeGroup'],
        order: [['timeGroup', 'ASC']]
      });
      
      return {
        period,
        total: totalAccesses,
        successful: successfulAccesses,
        failed: failedAccesses,
        byType: accessesByType,
        byUser: accessesByUser,
        byDevice: accessesByDevice,
        byTime: accessesByTimeGroup,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de acessos:', error);
      throw error;
    }
  }
  
  // Verificar status de todos os dispositivos
  async checkAllDevicesStatus() {
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
      
      return results;
    } catch (error) {
      console.error('Erro ao verificar status dos dispositivos:', error);
      throw error;
    }
  }
}

module.exports = new MonitoringService();
