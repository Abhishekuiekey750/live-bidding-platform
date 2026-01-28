/**
 * Fetches items from API and keeps them in sync with UPDATE_BID and BID_REJECTED.
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchItems } from '../services/api.js';
import { useSocket } from '../context/SocketContext.jsx';

const UPDATE_BID = 'UPDATE_BID';

export function useItems(userId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { subscribe } = useSocket();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchItems();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || 'Failed to load items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = subscribe(UPDATE_BID, (payload) => {
      if (!payload?.itemId) return;
      setItems((prev) =>
        prev.map((it) =>
          it.id === payload.itemId
            ? {
                ...it,
                currentBid: payload.currentBid,
                highestBidder: payload.highestBidder,
              }
            : it
        )
      );
    });
    return unsub;
  }, [subscribe]);

  return { items, loading, error, reload: load };
}
