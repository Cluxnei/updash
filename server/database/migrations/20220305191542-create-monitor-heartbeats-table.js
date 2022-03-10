

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('monitor_heart_beats', {
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
      status_code: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      response_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      is_failed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

  async down (queryInterface) {
    await queryInterface.dropTable('monitor_heart_beats');
  }
};
