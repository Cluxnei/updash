const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const port = process.env.SERVER_PORT || 4001;
const index = require("./routes/index");
const { CONSOLE_COLORS } = require("./helpers");

const app = express();
app.use(cors());

app.use(index);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ['GET', 'POST']
  }
});

const log = (socket, message) => {
  console.log(`${CONSOLE_COLORS.FgMagenta}${new Date().toISOString()}:${CONSOLE_COLORS.FgYellow}[${socket.id}]${CONSOLE_COLORS.Reset} - ${message}`);
};

function handleLoginAttempt(socket, {username, password}) {
  const allowedUsers = process.env.ALLOWED_USERS.split(",");
  if (!username || !password || !allowedUsers.includes(username)) {
    log(socket, "invalid username or password");
    socket.emit('failed-login', {message: "invalid username or password"});
    return;
  }
  const allowedUserIndex = allowedUsers.indexOf(username);
  const allowedUserPassword = process.env.ALLOWED_USERS_PASSWORDS.split(",")[allowedUserIndex];
  if (password !== allowedUserPassword) {
    log(socket, "invalid username or password");
    socket.emit('failed-login', {message: "invalid username or password"});
    return;
  }
  const expiresInOneHour = new Date(Date.now() + 3600000);
  socket.emit('successful-login', {
    username,
    expires: expiresInOneHour.getTime(),
    message: `Welcome ${username}!`,
  });
}

io.on("connection", (socket) => {
  log(socket, "new client connected");
  socket.on('login-attempt', (data) => handleLoginAttempt(socket, data));
  socket.on("disconnect", () => {
    log(socket, "client disconnected");
  });
});

server.listen(port, () => log({id: 'server'}, `listening on port ${port}`));