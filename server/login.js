const { log } = require("./helpers");

function handleLoginAttempt(socket, { username, password }) {
    const allowedUsers = process.env.ALLOWED_USERS.split(",");
    if (!username || !password || !allowedUsers.includes(username)) {
        log(socket, "invalid username or password");
        socket.emit('failed-login', { message: "invalid username or password" });
        return;
    }
    const allowedUserIndex = allowedUsers.indexOf(username);
    const allowedUserPassword = process.env.ALLOWED_USERS_PASSWORDS.split(",")[allowedUserIndex];
    if (password !== allowedUserPassword) {
        log(socket, "invalid username or password");
        socket.emit('failed-login', { message: "invalid username or password" });
        return;
    }
    const expiresInOneHour = new Date(Date.now() + 3600000);
    socket.emit('successful-login', {
        username,
        expires: expiresInOneHour.getTime(),
        message: `Welcome ${username}!`,
    });
};


module.exports = {
    handleLoginAttempt,
};