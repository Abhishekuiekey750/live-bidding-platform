/**
 * Auction dashboard: grid of item cards, server-synced time, optional user id.
 * Feeds socket serverTime into useServerTime for accurate countdowns.
 */
import { useEffect, useState } from 'react';
import { useItems } from '../hooks/useItems.js';
import { useServerTime } from '../hooks/useServerTime.js';
import { useSocket } from '../context/SocketContext.jsx';
import { ItemCard } from './ItemCard.jsx';

const DEFAULT_USER = 'user-' + Math.random().toString(36).slice(2, 9);
const UPDATE_BID = 'UPDATE_BID';

export function AuctionDashboard() {
  const [userId, setUserId] = useState(() => {
    try {
      return localStorage.getItem('liveBiddingUserId') || DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });
  const [lastServerTime, setLastServerTime] = useState(null);
  const { items, loading, error, reload } = useItems(userId);
  const { remainingMs, synced } = useServerTime(lastServerTime);
  const { subscribe, emit, connected } = useSocket();

  useEffect(() => {
    return subscribe(UPDATE_BID, (payload) => {
      if (payload?.serverTime) setLastServerTime(payload.serverTime);
    });
  }, [subscribe]);

  const handleUserIdChange = (e) => {
    const v = e.target.value.trim() || DEFAULT_USER;
    setUserId(v);
    try {
      localStorage.setItem('liveBiddingUserId', v);
    } catch {}
  };

  return (
    <div className="dashboard" style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
          Live Bidding
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            You are:
            <input
              type="text"
              value={userId}
              onChange={handleUserIdChange}
              placeholder="User ID"
              style={{
                marginLeft: '0.5rem',
                padding: '6px 10px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontFamily: 'var(--font-mono)',
                width: 120,
              }}
            />
          </label>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: connected ? 'var(--win)' : 'var(--outbid)',
            }}
            title={connected ? 'Connected' : 'Disconnected'}
          />
          {!synced && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Syncing time…</span>}
        </div>
      </header>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,107,107,0.15)', borderRadius: 8, color: 'var(--outbid)' }}>
          {error}
          <button
            type="button"
            onClick={reload}
            style={{ marginLeft: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading items…</p>
      ) : (
        <div
          className="item-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              userId={userId}
              remainingMs={remainingMs}
              subscribe={subscribe}
              emit={emit}
              connected={connected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
