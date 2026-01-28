/**
 * HTTP + Socket.io server. Server time and bid state are authoritative here.
 */
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { registerBidHandler } from './sockets/bidHandler.js';
import { logger } from './utils/logger.js';

const PORT = Number(process.env.PORT) || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});



registerBidHandler(io);

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
