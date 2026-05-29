const { Server } = require("socket.io");
const { setSocketServer } = require("../services/socketHub");

const attachSocketIo = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    if (userId) socket.join(`user:${userId}`);

    socket.on("join-user", (payload = {}) => {
      if (payload.userId) socket.join(`user:${payload.userId}`);
    });
  });

  setSocketServer(io);
  return io;
};

module.exports = { attachSocketIo };
