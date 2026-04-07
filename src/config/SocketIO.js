import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import AuthService from '../services/AuthService.js';
import logger from '../utils/logger.js';

let io = null;

export function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Token não informado.'));
      }

      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET_ACCESS_TOKEN,
      );

      const authService = new AuthService();
      const tokenData = await authService.loadTokens(decoded.id);

      if (!tokenData?.data?.refresh_token) {
        return next(new Error('Sessão inválida. Autentique-se novamente.'));
      }

      socket.userId = decoded.id;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Token expirado.'));
      }
      return next(new Error('Token inválido.'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    logger.info(
      `[Socket.IO] Usuário ${socket.userId} conectado. Socket: ${socket.id}`,
    );

    socket.on('join', (room) => {
      socket.join(room);
      logger.info(`[Socket.IO] Socket ${socket.id} entrou na room: ${room}`);
    });

    socket.on('leave', (room) => {
      socket.leave(room);
      logger.info(`[Socket.IO] Socket ${socket.id} saiu da room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(
        `[Socket.IO] Usuário ${socket.userId} desconectado. Motivo: ${reason}`,
      );
    });
  });

  logger.info('[Socket.IO] Servidor inicializado.');
  return io;
}

export function getIO() {
  return io;
}
