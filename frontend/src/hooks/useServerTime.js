/**
 * Server-authoritative time sync for countdown timers.
 * We use serverTime from /time and each UPDATE_BID to compute client drift
 * and derive remaining ms from auctionEndTime. Never trust client Date alone
 * for "time left" — only use it to interpolate after syncing to server.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchServerTime } from '../services/api.js';

export function useServerTime(serverTimeFromSocket) {
  const [serverTime, setServerTime] = useState(null);
  const driftRef = useRef(0); // client - server at last sync

  const syncFromApi = async () => {
    try {
      const serverStr = await fetchServerTime();
      const serverMs = new Date(serverStr).getTime();
      driftRef.current = Date.now() - serverMs;
      setServerTime(serverStr);
    } catch {
      setServerTime(new Date().toISOString());
    }
  };

  useEffect(() => {
    syncFromApi();
    const t = setInterval(syncFromApi, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (serverTimeFromSocket) {
      const serverMs = new Date(serverTimeFromSocket).getTime();
      driftRef.current = Date.now() - serverMs;
      setServerTime(serverTimeFromSocket);
    }
  }, [serverTimeFromSocket]);

  /**
   * Remaining ms until end. Uses server-derived time (driftRef). Stable ref so countdown effect doesn't thrash.
   */
  const remainingMs = useCallback((auctionEndTimeIso) => {
    const end = new Date(auctionEndTimeIso).getTime();
    const n = serverTime != null ? Date.now() - driftRef.current : Date.now();
    return Math.max(0, end - n);
  }, [serverTime]);

  return { serverTime, remainingMs, synced: !!serverTime };
}
