'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
    static associate(models) {
      // Não há associações diretas para configurações
    }
  }
  
  Setting.init({
    key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      // Categorias possíveis:
      // 'general', 'email', 'ldap', 'tacacs', 'radius', 'backup', 'terminal', etc.
    },
    description: {
      type: DataTypes.STRING
    },
    // Chave composta (category + key) deve ser única
    uniqueKey: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.category}:${this.key}`;
      },
      set(value) {
        throw new Error('Não é possível definir uniqueKey diretamente');
      }
    }
  }, {
    sequelize,
    modelName: 'Setting',
    indexes: [
      // Criar índice composto para category + key
      {
        unique: true,
        fields: ['category', 'key']
      }
    ]
  });
  
  return Setting;
};
