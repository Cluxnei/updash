

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('monitors', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'down',
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'http',
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      heart_beat_interval: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 60,
      },
      min_fail_attemps_to_down: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      max_redirects: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      min_acceptable_status_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 200,
      },
      max_acceptable_status_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 299,
      },
      method: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'GET',
      },
      headers: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      body: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      runned_at: {
        type: Sequelize.DATE,
        allowNull: true,
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('monitors');
  }
};
