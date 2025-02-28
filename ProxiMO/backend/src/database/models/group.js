'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      // Grupo tem muitos usuários
      Group.hasMany(models.User, {
        foreignKey: 'groupId',
        as: 'users'
      });
    }
  }
  
  Group.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: DataTypes.STRING,
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        // Permissões padrão (nenhuma)
        users: {
          view: false,
          create: false,
          edit: false,
          delete: false
        },
        devices: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          connect: false
        },
        settings: {
          view: false,
          edit: false,
          delete: false
        },
        logs: {
          view: false,
          delete: false
        }
      }
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Group',
  });
  
  return Group;
};
