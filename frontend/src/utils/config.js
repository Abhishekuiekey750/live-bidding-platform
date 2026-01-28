/**
 * API and Socket base URLs. In dev (Vite) use proxy /api and localhost:4000 for socket.
 * In production set VITE_API_URL and VITE_SOCKET_URL (e.g. Render backend URL).
 */
const dev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const API_BASE =
  typeof import.meta.env?.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
    : (dev ? '' : (typeof window !== 'undefined' ? '' : `http://${host}:4000`));

export const SOCKET_URL =
  typeof import.meta.env?.VITE_SOCKET_URL === 'string' && import.meta.env.VITE_SOCKET_URL
    ? String(import.meta.env.VITE_SOCKET_URL)
    : (dev ? `http://localhost:4000` : (typeof window !== 'undefined' ? `${protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}` : `http://${host}:4000`));
