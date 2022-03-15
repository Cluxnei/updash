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
        connection.end();
        connection = null;
    }
}

function _escape(value) {
    return value;
}

function _query(sql, params = []) {
    log({id: 'db'}, {sql: sql.split('\n').map(l => l.trim()).join(''), params});
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

function _insert(table, object) {
    const sql = `INSERT INTO ${table} (${Object.keys(object).join(',')}) VALUES (${Object.keys(object).map(() => '?').join(',')})`;
    return _query(sql, Object.values(object));
}

function _insert_many(table, fields, values) {
    const sql = `INSERT INTO ${table} (${fields}) VALUES ${values.map(() => '(' + values.map(_escape).join(',') + ')').join(',')}`;
    return _query(sql);
}

function _update(table, object, where = null, params = []) {
    const sql = `UPDATE ${table} SET ${Object.keys(object).map(k => k + '= ?').join(',')}${where ? (' WHERE ' + where) : ''}`;
    return _query(sql, [...Object.values(object), ...params]);
}

function _delete(table, where = null, params = []) {
    const sql = `DELETE FROM ${table}${where ? (' WHERE ' + where) : ''}`;
    return _query(sql, params);
}

const SOFT_DELETES_WHERE = 'deleted_at IS NULL';

module.exports = {
    getConnection,
    closeConnection,
    _query,
    _select,
    _insert,
    _update,
    _delete,
    _insert_many,
    SOFT_DELETES_WHERE
};