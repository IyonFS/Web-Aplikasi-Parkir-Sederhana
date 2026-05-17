// services/socket.service.js
import { io } from 'socket.io-client';
import { authService } from './auth.service';

let socket = null;

// Di production: VITE_API_URL = https://hygiopark.io
// Di development: socket konek ke localhost:4000 via Vite proxy
const SOCKET_URL = import.meta.env.VITE_API_URL || '';
const isDev = import.meta.env.DEV;

export const socketService = {
  connect() {
    if (socket?.connected) return socket;
    const token = authService.getToken();
    if (!token) return null;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      path: '/socket.io',
    });

    socket.on('connect', () => {
      if (isDev) console.info('WebSocket terhubung', socket.id);
    });
    socket.on('connect_error', (err) => {
      console.warn('WebSocket gagal konek:', err.message);
    });
    socket.on('disconnect', (reason) => {
      if (isDev) console.info('WebSocket terputus', reason);
    });

    return socket;
  },

  disconnect() {
    if (socket) { socket.disconnect(); socket = null; }
  },

  joinLot(lotId) {
    if (socket?.connected && lotId) socket.emit('join:lot', { lotId });
  },

  leaveLot(lotId) {
    if (socket?.connected && lotId) socket.emit('leave:lot', { lotId });
  },

  on(event, callback) { socket?.on(event, callback); },
  off(event, callback) { socket?.off(event, callback); },
  isConnected() { return socket?.connected ?? false; },
  getSocket() { return socket; },
};



