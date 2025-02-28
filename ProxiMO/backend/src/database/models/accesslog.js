'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AccessLog extends Model {
    static associate(models) {
      // AccessLog pertence a um usuário (opcional)
      AccessLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        allowNull: true
      });
      
      // AccessLog pode pertencer a um dispositivo (opcional)
      AccessLog.belongsTo(models.Device, {
        foreignKey: 'deviceId',
        as: 'device',
        allowNull: true
      });
    }
  }
  
  AccessLog.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Devices',
        key: 'id'
      }
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    accessType: {
      type: DataTypes.STRING,
      allowNull: false,
      // Exemplos: 'login', 'logout', 'create-device', 'update-user', 'connect-ssh'
    },
    status: {
      type: DataTypes.ENUM('success', 'failure', 'attempt'),
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AccessLog',
    // Impedir atualização de logs (apenas inserção)
    updatedAt: false
  });
  
  return AccessLog;
};
