const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const port = process.env.SERVER_PORT || 4001;
const index = require("./routes/index");
const { log, delay } = require("./helpers");
const { closeConnection } = require("./database/connection");
const { socketRoutes } = require("./socket");
const { handleMonitorsThread } = require("./monitor");

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

const clientsConnected = {};

io.on("connection", (socket) => {
  log(socket, "new client connected");
  clientsConnected[socket.id] = socket;
  socketRoutes(socket);
  socket.on("disconnect", () => {
    log(socket, "client disconnected");
    delete clientsConnected[socket.id];
  });
  log({id: 'server'}, `total clients connected: ${Object.keys(clientsConnected).length}`);
});

let mainMonitorsThreadShouldRun = true;
let elapsedTimeInSeconds = 0;

async function mainMonitorsThread() {
  log({id: 'main-monitors-thread'}, "main monitors thread start");
  await handleMonitorsThread(io, elapsedTimeInSeconds);
  log({id: 'main-monitors-thread'}, "main monitors thread done");
  await delay(1000);
  elapsedTimeInSeconds++;
  if (mainMonitorsThreadShouldRun) {
    mainMonitorsThread();
  }
}

if (mainMonitorsThreadShouldRun) {
  log({id: 'server'}, "main monitors first thread started");
  mainMonitorsThread().then(() => {
    log({id: 'server'}, "main monitors first thread ended");
  });
}

server.listen(port, () => log({id: 'server'}, `listening on port ${port}`));

function gracefulShutdown() {
  log({id: 'server'}, "graceful shutdown");
  log({id: 'graceful-shutdown'}, "stopping main monitors thread");
  mainMonitorsThreadShouldRun = false;
  log({id: 'graceful-shutdown'}, "closing database connection");
  closeConnection();
  log({id: 'graceful-shutdown'}, "database connection closed");
  log({id: 'graceful-shutdown'}, "closing server");
  server.close(() => {
    process.exit(0);
  });
  log({id: 'graceful-shutdown'}, "server closed");
}

process.on('SIGINT', gracefulShutdown);

process.on('SIGTERM', gracefulShutdown);

process.on('SIGUSR2', gracefulShutdown);

process.on('uncaughtException', (err) => {
  log({id: 'server'}, "uncaughtException");
  log({id: 'server'}, err);
  gracefulShutdown();
});