

const { log, randomColor } = require("../../helpers");
const { monitorFactory } = require("../../monitor");

module.exports = {
  async up(queryInterface) {

    const numberToInset = 10;

    const monitors = [];

    for (let i = 0; i < numberToInset; i++) {
      const monitor = monitorFactory();
      log({id: 'seeder'}, `Generating monitor ${i}`, monitor);
      monitors.push(monitor);
    }

    await queryInterface.bulkInsert('monitors', monitors, {});

    const monitorsIds = await queryInterface.sequelize.query(
      `SELECT id FROM monitors`,
      {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const monitorsTags = [];

    monitorsIds.forEach(monitor => {
      for (let i = 0; i < Math.floor(Math.random() * 6); i++) {
        monitorsTags.push({
          monitor_id: monitor.id,
          name: `tag-${i}`,
          color: randomColor(),
        });
      }
    });

    await queryInterface.bulkInsert('monitor_tags', monitorsTags, {});
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
