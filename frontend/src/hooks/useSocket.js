// hooks/useSocket.js
// Custom hook untuk subscribe ke WebSocket events dengan cleanup otomatis

import { useEffect, useRef } from 'react';
import { socketService } from '../services/socket.service';

/**
 * Subscribe ke satu event WebSocket.
 * Cleanup otomatis saat komponen unmount.
 *
 * @param {string} event - nama event, misal 'slot:updated'
 * @param {function} callback - fungsi yang dipanggil saat event masuk
 * @param {Array} deps - dependency array (opsional)
 */
export function useSocketEvent(event, callback, deps = []) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback; // selalu pakai callback terbaru

  useEffect(() => {
    const handler = (...args) => callbackRef.current(...args);
    socketService.on(event, handler);
    return () => socketService.off(event, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}

/**
 * Subscribe ke beberapa event sekaligus.
 *
 * @param {Object} handlers - { 'event:name': callbackFn }
 */
export function useSocketEvents(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const entries = Object.entries(handlersRef.current);
    const wrappedHandlers = entries.map(([event, cb]) => {
      const handler = (...args) => handlersRef.current[event]?.(...args);
      socketService.on(event, handler);
      return { event, handler };
    });

    return () => {
      wrappedHandlers.forEach(({ event, handler }) => {
        socketService.off(event, handler);
      });
    };
  }, []);
}

/**
 * Gabung room lot dan auto-leave saat unmount.
 *
 * @param {string|null} lotId
 */
export function useSocketLot(lotId) {
  useEffect(() => {
    if (!lotId) return;
    socketService.joinLot(lotId);
    return () => socketService.leaveLot(lotId);
  }, [lotId]);
}

