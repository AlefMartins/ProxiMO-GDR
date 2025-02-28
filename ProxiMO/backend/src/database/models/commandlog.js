'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CommandLog extends Model {
    static associate(models) {
      // CommandLog pertence a um usuário
      CommandLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      // CommandLog pertence a um dispositivo
      CommandLog.belongsTo(models.Device, {
        foreignKey: 'deviceId',
        as: 'device'
      });
    }
  }
  
  CommandLog.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Devices',
        key: 'id'
      }
    },
    command: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    output: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('success', 'failure', 'unknown'),
      defaultValue: 'unknown'
    }
  }, {
    sequelize,
    modelName: 'CommandLog',
    // Impedir atualização de logs (apenas inserção)
    updatedAt: false,
    createdAt: false
  });
  
  return CommandLog;
};
