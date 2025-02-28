'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Backup extends Model {
    static associate(models) {
      // Backup pertence a um dispositivo
      Backup.belongsTo(models.Device, {
        foreignKey: 'deviceId',
        as: 'device'
      });
      
      // Backup foi criado por um usuário
      Backup.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdBy'
      });
    }
  }
  
  Backup.init({
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Devices',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('full', 'config', 'manual', 'auto'),
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Backup',
    // Apenas timestamp de criação
    updatedAt: false
  });
  
  return Backup;
};
