const mysql = require('mysql');
const { log } = require('../helpers');

let connection = null;

function getConnection() {
    if (connection === null) {
        connection = mysql.createConnection({
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
        connection.close();
        connection = null;
    }
}

function _escape(value) {
    return getConnection().escape(value);
}

function _query(sql, params = []) {
    log({id: 'db'}, {sql, params});
    return new Promise((resolve, reject) => {
        getConnection().query(sql, params.map(_escape), (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function _select(fields, table, where = null, params = [], orderBy = null, limit = null) {
    const sql = `SELECT ${fields.join(',')} FROM ${table}${where ? (' WHERE ' + where) : ''}${orderBy ? (' ORDER BY ' + orderBy) : ''}${limit ? (' LIMIT ' + limit) : ''}`;
    return _query(sql, params ? params : []);
}

function _insert(table, fields, values) {
    const sql = `INSERT INTO ${table} (${fields}) VALUES (${values})`;
    return _query(sql);
}

function _insert_many(table, fields, values) {
    const sql = `INSERT INTO ${table} (${fields}) VALUES ${values.map(() => '(' + values.map(_escape).join(',') + ')').join(',')}`;
    return _query(sql);
}

function _update(table, fields, values, where = null, params = []) {
    const sql = `UPDATE ${table} SET ${fields}${where ? (' WHERE ' + where) : ''}`;
    return _query(sql, params);
}

function _delete(table, where = null, params = []) {
    const sql = `DELETE FROM ${table}${where ? (' WHERE ' + where) : ''}`;
    return _query(sql, params);
}

module.exports = {
    getConnection,
    closeConnection,
    _query,
    _select,
    _insert,
    _update,
    _delete,
    _insert_many,
};