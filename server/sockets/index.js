const { Server } = require('socket.io');
const config = require('../config/env');
const { resolveUserFromToken } = require('../middleware/auth');
const { AUTH_COOKIE } = require('../utils/tokens');

let io = null;

function parseCookies(header = '') {
  return header.split(';').reduce((acc, part) => {
    const index = part.indexOf('=');
    if (index > -1) {
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      try {
        acc[key] = decodeURIComponent(value);
      } catch {
        acc[key] = value;
      }
    }
    return acc;
  }, {});
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrls,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie || '');
      const token = cookies[AUTH_COOKIE];
      if (!token) return next(new Error('UNAUTHORIZED'));
      const user = await resolveUserFromToken(token);
      socket.data.user = {
        id: String(user._id),
        role: user.role,
        name: user.name,
      };
      return next();
    } catch (error) {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.data.user;
    socket.join(`user:${id}`);
    socket.emit('socket:ready', { connected: true, role });
    console.log(`Socket connected for ${role} account ${id}`);

    socket.on('disconnect', () => {
      // no presence state is trusted for notification delivery; MongoDB is the source of truth
    });
  });

  return io;
}

/** Returns true when a socket server exists; delivery is best-effort only. */
function emitToUser(userId, event, payload) {
  if (!io) return false;
  io.to(`user:${String(userId)}`).emit(event, payload);
  return true;
}

function getIO() {
  return io;
}

module.exports = { initSocket, emitToUser, getIO };
