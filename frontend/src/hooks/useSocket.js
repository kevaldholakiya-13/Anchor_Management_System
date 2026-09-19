import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
}

/**
 * useSocket — manages socket.io connection for a specific event room.
 * @param {string|null} eventId
 * @param {{ onSessionUpdate?: fn, onScriptReady?: fn, onDisruptionActive?: fn }} handlers
 */
export function useSocket(eventId, handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const joinEvent = useCallback((id) => {
    const socket = getSocket();
    socket.emit('join:event', id);
  }, []);

  const leaveEvent = useCallback((id) => {
    const socket = getSocket();
    socket.emit('leave:event', id);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onSessionUpdate = (data) => handlersRef.current.onSessionUpdate?.(data);
    const onScriptReady   = (data) => handlersRef.current.onScriptReady?.(data);
    const onDisruption    = (data) => handlersRef.current.onDisruptionActive?.(data);

    socket.on('session:update', onSessionUpdate);
    socket.on('script:ready', onScriptReady);
    socket.on('disruption:active', onDisruption);

    if (eventId) {
      socket.emit('join:event', eventId);
    }

    return () => {
      socket.off('session:update', onSessionUpdate);
      socket.off('script:ready', onScriptReady);
      socket.off('disruption:active', onDisruption);
      if (eventId) {
        socket.emit('leave:event', eventId);
      }
    };
  }, [eventId]);

  return { joinEvent, leaveEvent, socket: getSocket() };
}
