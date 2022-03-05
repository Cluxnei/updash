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

const clientsConnected = {};

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

function randomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

function monitorTagFactory(id = null) {
  const _id = id || Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
  return {
    id: _id,
    name: `Tag ${_id}`,
    color: randomColor(),
  };
}

function fixHeartbeatLength(heartbeats) {
  const FIXED_HEART_BEATS = 11;
  if (heartbeats.length > FIXED_HEART_BEATS) {
    return heartbeats;
  }
  const numberOfEmptyHeartbeats = FIXED_HEART_BEATS - heartbeats.length;
  const emptyHeartbeats = [];
  for (let i = 0; i < numberOfEmptyHeartbeats; i++) {
    emptyHeartbeats.push({
      id: 'empty',
      status: 'none',
      color: 'gray',
      responseTime: null,
    });
  }
  return [...emptyHeartbeats, ...heartbeats];
}

function monitorHeartbeatFactory(id = null) {
  const _id = id || Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
  const status = Math.random() > 0.5 ? "up" : "down";
  return {
    id: _id,
    status,
    color: status === "up" ? "green" : "red",
    responseTime: Math.random() * 472,
  };
}

function monitorFactory(id = null) {
  const _id = id || Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
  const status = Math.random() > 0.5 ? "up" : "down";
  const tags = [];
  const numberOfTags = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 5);
  for (let i = 0; i < numberOfTags; i++) {
    tags.push(monitorTagFactory(i));
  }
  const heartbeats = [];
  const numberOfHeartbeats = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 15);
  for (let i = 0; i < numberOfHeartbeats; i++) {
    heartbeats.push(monitorHeartbeatFactory(i));
  }
  return {
    id: _id,
    name: `Monitor ${_id}`,
    description: `This is monitor ${_id} description`,
    status,
    upTimePercentage: Math.random() * 100,
    uptimeColor: status === "up" ? "green" : "red",
    tags,
    heartbeats: fixHeartbeatLength(heartbeats),
  };
}

let mockedMonitors = [];
function randomMonitors() {
  mockedMonitors = [];
  const numberOfMockedMonitors = Math.floor(Math.random() * 100);
  for (let i = 0; i < numberOfMockedMonitors; i++) {
    mockedMonitors.push(monitorFactory());
  }
}

function handleGetMonitors(socket, _) {
  randomMonitors();
  socket.emit('monitors-list', mockedMonitors);
}

io.on("connection", (socket) => {
  log(socket, "new client connected");
  clientsConnected[socket.id] = socket;
  socket.on('login-attempt', (data) => handleLoginAttempt(socket, data));
  socket.on('get-monitors', (data) => handleGetMonitors(socket, data));
  socket.on("disconnect", () => {
    log(socket, "client disconnected");
    delete clientsConnected[socket.id];
  });
  log({id: 'server'}, `total clients connected: ${Object.keys(clientsConnected).length}`);
});

server.listen(port, () => log({id: 'server'}, `listening on port ${port}`));