/**
 * REST client. In dev uses Vite proxy /api; in production uses VITE_API_URL.
 */
import { API_BASE } from '../utils/config.js';

const dev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const base = dev ? '/api' : (API_BASE || '');

export async function fetchItems() {
  const res = await fetch(`${base}/items`);
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

/**
 * Fetch server time for timer sync. Do not trust client Date only.
 */
export async function fetchServerTime() {
  const res = await fetch(`${base}/time`);
  if (!res.ok) throw new Error('Failed to fetch server time');
  const data = await res.json();
  return data.serverTime;
}
