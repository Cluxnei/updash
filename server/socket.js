const { handleGetMonitors, handlePauseMonitor, handleResumeMonitor } = require("./monitor");
const { handleLoginAttempt } = require("./login");


function socketRoutes(socket) {
    socket.on('login-attempt', (data) => handleLoginAttempt(socket, data));
    socket.on('get-monitors', (data) => handleGetMonitors(socket, data));
    socket.on('pause-monitor', (data) => handlePauseMonitor(socket, data));
    socket.on('resume-monitor', (data) => handleResumeMonitor(socket, data));
};

module.exports = {
    socketRoutes,
};