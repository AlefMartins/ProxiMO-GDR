'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Groups', [
      {
        name: 'Administradores',
        description: 'Grupo com acesso completo ao sistema',
        permissions: JSON.stringify({
          users: {
            view: true,
            create: true,
            edit: true,
            delete: true
          },
          devices: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            connect: true
          },
          settings: {
            view: true,
            edit: true,
            delete: true
          },
          logs: {
            view: true,
            delete: true
          }
        }),
        isDefault: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Operadores',
        description: 'Grupo com acesso para gerenciar dispositivos',
        permissions: JSON.stringify({
          users: {
            view: true,
            create: false,
            edit: false,
            delete: false
          },
          devices: {
            view: true,
            create: true,
            edit: true,
            delete: false,
            connect: true
          },
          settings: {
            view: true,
            edit: false,
            delete: false
          },
          logs: {
            view: true,
            delete: false
          }
        }),
        isDefault: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Leitores',
        description: 'Grupo com acesso somente leitura',
        permissions: JSON.stringify({
          users: {
            view: true,
            create: false,
            edit: false,
            delete: false
          },
          devices: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            connect: false
          },
          settings: {
            view: true,
            edit: false,
            delete: false
          },
          logs: {
            view: true,
            delete: false
          }
        }),
        isDefault: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Groups', null, {});
  }
};
