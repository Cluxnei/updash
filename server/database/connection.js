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
      multipleStatements: true,
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

function escape(value) {
  return value;
}

function dbQuery(sql, params = []) {
  log({ id: 'db' }, { sql: sql.split('\n').map((l) => l.trim()).join(''), params });
  return new Promise((resolve, reject) => {
    getConnection().query(sql, params.map(escape), (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function dbSelect(fields, table, where = null, params = [], orderBy = null, limit = null) {
  const sql = `SELECT ${fields.join(',')} FROM ${table}${where ? (` WHERE ${where}`) : ''}${orderBy ? (` ORDER BY ${orderBy}`) : ''}${limit ? (` LIMIT ${limit}`) : ''}`;
  return dbQuery(sql, params || []);
}

function dbInsert(table, object) {
  const sql = `INSERT INTO ${table} (${Object.keys(object).join(',')}) VALUES (${Object.keys(object).map(() => '?').join(',')})`;
  return dbQuery(sql, Object.values(object));
}

function dbLastInsertId() {
  return dbQuery('SELECT LAST_INSERT_ID() AS id').then((rows) => rows[0].id);
}

function dbInsertMany(table, fields, values) {
  const sql = `INSERT INTO ${table} (${fields}) VALUES ${values.map(() => `(${values.map(escape).join(',')})`).join(',')}`;
  return dbQuery(sql);
}

function dbUpdate(table, object, where = null, params = []) {
  const sql = `UPDATE ${table} SET ${Object.keys(object).map((k) => `${k}= ?`).join(',')}${where ? (` WHERE ${where}`) : ''}`;
  return dbQuery(sql, [...Object.values(object), ...params]);
}

function dbDelete(table, where = null, params = []) {
  const sql = `DELETE FROM ${table}${where ? (` WHERE ${where}`) : ''}`;
  return dbQuery(sql, params);
}

const SOFT_DELETES_WHERE = 'deleted_at IS NULL';

module.exports = {
  getConnection,
  closeConnection,
  _query: dbQuery,
  _select: dbSelect,
  _insert: dbInsert,
  _lastInsertId: dbLastInsertId,
  _update: dbUpdate,
  _delete: dbDelete,
  _insert_many: dbInsertMany,
  SOFT_DELETES_WHERE,
};
