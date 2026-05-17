// context/SocketContext.jsx
// Inisialisasi WebSocket saat user login, putuskan saat logout

import { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socket.service';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    if (!user) {
      // User logout → putuskan WebSocket
      socketService.disconnect();
      setConnected(false);
      return;
    }

    // User login → sambungkan WebSocket
    const socket = socketService.connect();
    if (!socket) return;

    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect',    onConnect);
    socket.on('disconnect', onDisconnect);

    // Update status awal
    setConnected(socket.connected);

    return () => {
      socket.off('connect',    onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => useContext(SocketContext);

