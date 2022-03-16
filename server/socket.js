const {
  handleGetMonitors, handlePauseMonitor, handleResumeMonitor, handleDeleteMonitor,
} = require('./monitor');
const { handleLoginAttempt, handleUserTokenExpired, getUserByToken } = require('./login');

async function middleware(socket, data, next) {
  if (handleUserTokenExpired(socket, data.token)) {
    return;
  }
  next({__user: await getUserByToken(data.token)});
}

function socketRoutes(socket) {
  socket.on('login-attempt', (data) => handleLoginAttempt(socket, data));
  socket.on('get-monitors', (data) => middleware(socket, data, ({__user}) => handleGetMonitors(socket, {...data, __user})));
  socket.on('pause-monitor', (data) => middleware(socket, data, ({__user}) => handlePauseMonitor(socket, {...data, __user})));
  socket.on('resume-monitor', (data) => middleware(socket, data, ({__user}) => handleResumeMonitor(socket, {...data, __user})));
  socket.on('delete-monitor', (data) => middleware(socket, data, ({__user}) => handleDeleteMonitor(socket, {...data, __user})));
}

module.exports = {
  socketRoutes,
};
