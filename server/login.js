const { _select, _query, SOFT_DELETES_WHERE, _insert, _delete } = require('./database/connection');
const { log } = require('./helpers');
const {compare} = require('./password');
const uuidV4 = require('uuid').v4;

async function handleLoginAttempt(socket, { username, password }) {
  
  const failed = (message = 'Invalid credentials') => {
    log(socket, message);
    socket.emit('failed-login', { message });
  };
  
  const [user] = await _select(['id', 'name', 'username', 'password'], 'users', 'username = ?', [username], null, 1);

  if (!user || !user.id) {
    return failed();
  }

  const passwordAsserted = await compare(password, user.password);

  if (!passwordAsserted) {
    return failed();
  }

  const expiresInOneHour = new Date(Date.now() + (Number(process.env.SESSION_EXPIRES_IN_MS) || 3600000));

  const token = uuidV4();

  await _insert('users_tokens', {
    token,
    user_id: user.id,
    expires_at: expiresInOneHour.getTime(),
  });

  socket.emit('successful-login', {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      token,
    },
    expires: expiresInOneHour.getTime(),
    message: `Welcome ${user.name}!`,
  });
}

async function handleUserTokenExpired(socket, token) {

  _delete('users_tokens', 'expires_at <= UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000');
  
  const failed = (message = 'token expired') => {
    log(socket, message);
    socket.emit('login-token-expired', { message, token });
    _delete('users_tokens', 'token = ?', [token]);
    return true;
  };

  if (!token) {
    return failed();
  }

  const [userToken] = await _select(['id', 'expires_at'], 'users_tokens', 'token = ?', [token], null, 1);

  if (!userToken || !userToken.id) {
    return failed();
  }

  const expiresAt = new Date(userToken.expires_at);

  if (expiresAt < new Date()) {
    return failed();
  }
  return false;
}

async function getUserByToken(token) {
  const [user] = await _query(`SELECT * FROM users WHERE ${SOFT_DELETES_WHERE} AND id = (SELECT user_id FROM users_tokens WHERE token = ? LIMIT 1) LIMIT 1`, [token]);
  return user;
}

module.exports = {
  handleLoginAttempt,
  handleUserTokenExpired,
  getUserByToken,
};
