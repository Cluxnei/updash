const { randomColor } = require('../../helpers');
const { monitorFactory } = require('../../monitor');

module.exports = {
  async up(queryInterface) {
    const numberToInset = 10;

    const monitors = [];

    for (let i = 0; i < numberToInset; i += 1) {
      const monitor = monitorFactory();
      monitors.push(monitor);
    }

    await queryInterface.bulkInsert('monitors', monitors, {});

    const monitorsIds = await queryInterface.sequelize.query(
      'SELECT id FROM monitors',
      {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );

    const tags = [];

    for (let i = 0, t = Math.floor(Math.random() * 20); i < t; i += 1) {
      tags.push({
        name: `tag ${i}`,
        color: randomColor(),
      });
    }

    await queryInterface.bulkInsert('tags', tags, {});

    const tagsIds = await queryInterface.sequelize.query(
      'SELECT id FROM tags',
      {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );

    const monitorsTags = [];

    monitorsIds.forEach((monitor) => {
      for (let i = 0, t = Math.floor(Math.random() * 6); i < t; i += 1) {
        monitorsTags.push({
          monitor_id: monitor.id,
          tag_id: tagsIds[Math.floor(Math.random() * tagsIds.length)].id,
        });
      }
    });

    await queryInterface.bulkInsert('monitor_tags', monitorsTags, {});
  },

  async down() {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
