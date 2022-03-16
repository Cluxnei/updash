'use strict';

const {hash} = require('../../password');

module.exports = {
  async up (queryInterface) {

    const users = [];
    
    users.push({
      name: 'Kelvin Cluxnei',
      username: 'kelvin.cluxnei@viamaker.com',
      password: await hash('inicial@123'),
    });

    await queryInterface.bulkInsert('users', users, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
