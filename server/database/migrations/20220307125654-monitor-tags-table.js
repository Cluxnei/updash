module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('monitor_tags', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      monitor_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'monitors',
          key: 'id',
        },
      },
      tag_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id',
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('monitor_tags');
  },
};
