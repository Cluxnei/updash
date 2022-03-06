

const { log } = require("../../helpers");
const { monitorFactory } = require("../../monitor");

module.exports = {
  async up(queryInterface) {

    const numberToInset = 100;

    const monitors = [];

    for (let i = 0; i < numberToInset; i++) {
      const monitor = monitorFactory();
      log({id: 'seeder'}, `Generating monitor ${i}`, monitor);
      monitors.push(monitor);
    }

    await queryInterface.bulkInsert('monitors', monitors, {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
