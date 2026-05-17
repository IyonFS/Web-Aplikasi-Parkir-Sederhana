// context/NotifContext.jsx
// State global untuk notifikasi real-time

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { socketService } from '../services/socket.service';
import { useAuth } from './AuthContext';

const NotifContext = createContext(null);

export function NotifProvider({ children }) {
  const { user } = useAuth();
  const [notifs, setNotifs]       = useState([]);   // list semua notif
  const [unread, setUnread]       = useState(0);    // badge counter

  // Tambah notif baru
  const addNotif = useCallback((notif) => {
    const n = {
      id:      notif.id || `notif-${Date.now()}`,
      type:    notif.type || 'info',
      title:   notif.title || 'Notifikasi',
      message: notif.message || '',
      ts:      notif.ts || new Date().toISOString(),
      read:    false,
      reservationId: notif.reservationId || null,
    };
    setNotifs(prev => [n, ...prev].slice(0, 20)); // max 20 notif
    setUnread(prev => prev + 1);
  }, []);

  // Tandai semua sudah dibaca
  const markAllRead = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }, []);

  // Hapus satu notif
  const removeNotif = useCallback((id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }, []);

  // Subscribe ke WebSocket notification events
  useEffect(() => {
    if (!user) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const handler = (notif) => addNotif(notif);
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [user, addNotif]);

  return (
    <NotifContext.Provider value={{ notifs, unread, addNotif, markAllRead, removeNotif }}>
      {children}
    </NotifContext.Provider>
  );
}

export const useNotif = () => useContext(NotifContext);

