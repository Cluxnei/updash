const { handleGetMonitors } = require("./monitor");
const { handleLoginAttempt } = require("./login");


function socketRoutes(socket) {
    socket.on('login-attempt', (data) => handleLoginAttempt(socket, data));
    socket.on('get-monitors', (data) => handleGetMonitors(socket, data));
};

module.exports = {
    socketRoutes,
};