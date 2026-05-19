import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// In production, connect to same origin (Express serves the client)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);

let socketInstance = null;

export function useSocket(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, { autoConnect: true, reconnection: true });
    }

    const socket = socketInstance;
    const events = Object.keys(handlersRef.current);

    const listeners = {};
    for (const event of events) {
      listeners[event] = (...args) => handlersRef.current[event]?.(...args);
      socket.on(event, listeners[event]);
    }

    return () => {
      for (const event of events) {
        socket.off(event, listeners[event]);
      }
    };
  }, []);

  const emit = useCallback((event, data) => {
    socketInstance?.emit(event, data);
  }, []);

  return { emit, socket: socketInstance };
}
