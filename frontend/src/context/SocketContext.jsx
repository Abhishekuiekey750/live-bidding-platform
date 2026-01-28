import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createSocket } from '../services/socket.js';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    const sock = createSocket();
    socketRef.current = sock;

    sock.on('connect', () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));

    return () => {
      sock.removeAllListeners();
      sock.disconnect();
      socketRef.current = null;
      listenersRef.current.clear();
    };
  }, []);

  const subscribe = (event, cb) => {
    const sock = socketRef.current;
    if (!sock) return () => {};
    sock.on(event, cb);
    const key = event;
    if (!listenersRef.current.has(key)) listenersRef.current.set(key, []);
    listenersRef.current.get(key).push({ event, cb });
    return () => {
      sock.off(event, cb);
    };
  };

  const emit = (event, data) => {
    const sock = socketRef.current;
    if (sock?.connected) sock.emit(event, data);
  };

  const value = {
    connected,
    subscribe,
    emit,
    socket: socketRef.current,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
