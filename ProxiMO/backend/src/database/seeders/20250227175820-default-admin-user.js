'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Buscar o ID do grupo Administradores
    const adminGroup = await queryInterface.sequelize.query(
      `SELECT id FROM "Groups" WHERE name = 'Administradores' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!adminGroup || adminGroup.length === 0) {
      throw new Error('Grupo Administradores não encontrado. Execute o seeder de grupos primeiro.');
    }

    const adminGroupId = adminGroup[0].id;
    
    // Criar usuário administrador padrão
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    return queryInterface.bulkInsert('Users', [
      {
        username: 'admin',
        password: hashedPassword,
        fullName: 'Administrador do Sistema',
        email: 'admin@example.com',
        isActive: true,
        isLdapUser: false,
        groupId: adminGroupId,
        preferences: JSON.stringify({
          theme: 'light',
          language: 'pt-BR',
          dashboardLayout: 'default'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', { username: 'admin' }, {});
  }
};
