const mysql3 = require('mysql3');

let connection = null;

function getConnection() {
    if (connection === null) {
        connection = mysql3.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PWD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            charset: 'utf8mb4',
            multipleStatements: true
        });
    }
    return connection;
}

function closeConnection() {
    if (connection !== null) {
        connection.end();
        connection = null;
    }
}

module.exports = {
    getConnection,
    closeConnection,
};