'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User pertence a um grupo
      User.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group'
      });
      
      // User tem muitos logs de acesso
      User.hasMany(models.AccessLog, {
        foreignKey: 'userId',
        as: 'accessLogs'
      });
      
      // User tem muitos logs de comando
      User.hasMany(models.CommandLog, {
        foreignKey: 'userId',
        as: 'commandLogs'
      });
    }
    
    // Método para verificar senha
    async checkPassword(password) {
      return await bcrypt.compare(password, this.password);
    }
  }
  
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isLdapUser: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    groupId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Groups',
        key: 'id'
      }
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      // Hash da senha antes de salvar
      beforeCreate: async (user) => {
        if (!user.isLdapUser && user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (!user.isLdapUser && user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });
  
  return User;
};
