/**
 * Socket.io client factory. Uses VITE_SOCKET_URL in production; localhost:4000 in dev.
 */
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/config.js';

export function createSocket() {
  const url =
    SOCKET_URL && String(SOCKET_URL).trim()
      ? SOCKET_URL
      : (typeof window !== 'undefined' && (window.location.port === '3000' || window.location.port === '5173')
          ? 'http://localhost:4000'
          : (typeof window !== 'undefined'
              ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
              : 'http://localhost:4000'));
  return io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 10000,
  });
}
