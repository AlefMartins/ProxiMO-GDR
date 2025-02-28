'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Device extends Model {
    static associate(models) {
      // Device tem muitos logs de acesso
      Device.hasMany(models.AccessLog, {
        foreignKey: 'deviceId',
        as: 'accessLogs'
      });
      
      // Device tem muitos logs de comando
      Device.hasMany(models.CommandLog, {
        foreignKey: 'deviceId',
        as: 'commandLogs'
      });
      
      // Device pode ter um grupo (opcional)
      Device.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group',
        allowNull: true
      });
    }
  }
  
  Device.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isIP: true
      }
    },
    port: {
      type: DataTypes.INTEGER,
      defaultValue: 22
    },
    manufacturer: {
      type: DataTypes.STRING,
      defaultValue: 'Desconhecido'
    },
    model: {
      type: DataTypes.STRING,
      defaultValue: 'Desconhecido'
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'unknown'),
      defaultValue: 'unknown'
    },
    imageUrl: DataTypes.STRING,
    supportsSsh: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    supportsTelnet: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    supportsWinbox: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastPing: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Groups',
        key: 'id'
      }
    },
    credentials: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Device',
  });
  
  return Device;
};
