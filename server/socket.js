const {
  handleGetMonitors, handlePauseMonitor, handleResumeMonitor, handleDeleteMonitor, handleCreateMonitor, handleEditMonitor
} = require('./monitor');
const { handleLoginAttempt, handleUserTokenExpired, getUserByToken } = require('./login');
const { log } = require('./helpers');

async function middleware(socket, data, next) {
  if (await handleUserTokenExpired(socket, data.token)) {
    log({id: 'socket-middleware'}, 'denying request due to expired token');
    return;
  }
  next({__user: await getUserByToken(data.token)});
  log({id: 'socket-middleware'}, 'request authorized');
}

function socketRoutes(socket) {
  socket.on('login-attempt', (data) => handleLoginAttempt(socket, data));
  socket.on('get-monitors', (data) => middleware(socket, data, ({__user}) => handleGetMonitors(socket, {...data, __user})));
  socket.on('pause-monitor', (data) => middleware(socket, data, ({__user}) => handlePauseMonitor(socket, {...data, __user})));
  socket.on('resume-monitor', (data) => middleware(socket, data, ({__user}) => handleResumeMonitor(socket, {...data, __user})));
  socket.on('delete-monitor', (data) => middleware(socket, data, ({__user}) => handleDeleteMonitor(socket, {...data, __user})));
  socket.on('create-monitor', (data) => middleware(socket, data, ({__user}) => handleCreateMonitor(socket, {...data, __user})));
  socket.on('edit-monitor', (data) => middleware(socket, data, ({__user}) => handleEditMonitor(socket, {...data, __user})));
}

module.exports = {
  socketRoutes,
};
