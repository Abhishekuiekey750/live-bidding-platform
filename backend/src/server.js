/**
 * HTTP + Socket.io server. Server time and bid state are authoritative here.
 */
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { registerBidHandler } from './sockets/bidHandler.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT;

const server = http.createServer(app);





const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server listening on port", PORT);
});

registerBidHandler(io);

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
