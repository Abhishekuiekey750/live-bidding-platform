/**
 * Single auction item card: title, current bid, server-synced countdown, bid button.
 * Green flash on new bid; Winning / Outbid badges.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CountdownTimer } from './CountdownTimer.jsx';
import { BidButton } from './BidButton.jsx';

const BID_PLACED = 'BID_PLACED';
const UPDATE_BID = 'UPDATE_BID';
const BID_REJECTED = 'BID_REJECTED';

export function ItemCard({
  item,
  userId,
  remainingMs,
  serverTimeFromSocket,
  subscribe,
  emit,
  connected,
}) {
  const [flash, setFlash] = useState(false);
  const [outbid, setOutbid] = useState(false);
  const [loading, setLoading] = useState(false);
  const prevBidRef = useRef(item.currentBid);

  const isWinning = item.highestBidder === userId;
  const ended = remainingMs(item.auctionEndTime) <= 0;

  // Green flash when this item gets a new bid (from any user)
  useEffect(() => {
    let t;
    const unsub = subscribe(UPDATE_BID, (payload) => {
      if (payload?.itemId !== item.id) return;
      setFlash(true);
      if (t) clearTimeout(t);
      t = setTimeout(() => setFlash(false), 600);
    });
    return () => {
      if (t) clearTimeout(t);
      unsub();
    };
  }, [subscribe, item.id]);

  // Outbid state: we were winning, then someone else bid higher
  useEffect(() => {
    if (item.currentBid > prevBidRef.current && prevBidRef.current > 0) {
      if (item.highestBidder !== userId) setOutbid(true);
    }
    prevBidRef.current = item.currentBid;
  }, [item.currentBid, item.highestBidder, userId]);

  const handleBid = useCallback(() => {
    const amount = item.currentBid + 10;
    setLoading(true);
    setOutbid(false);
    emit(BID_PLACED, { itemId: item.id, bidAmount: amount, userId });
  }, [item.id, item.currentBid, userId, emit]);

  useEffect(() => {
    const unsub = subscribe(BID_REJECTED, () => {
      setLoading(false);
    });
    return unsub;
  }, [subscribe]);

  // Clear loading when our bid shows up as accepted (UPDATE_BID for this item)
  useEffect(() => {
    const unsub = subscribe(UPDATE_BID, (payload) => {
      if (payload?.itemId === item.id && payload?.highestBidder === userId) {
        setLoading(false);
      }
    });
    return unsub;
  }, [subscribe, item.id, userId]);

  return (
    <article
      className="item-card"
      data-flash={flash || undefined}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: '1.25rem',
        position: 'relative',
        transition: 'box-shadow 0.2s, background 0.3s',
      }}
    >
      {flash && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--radius)',
            pointerEvents: 'none',
            background: 'var(--flash)',
            animation: 'flash 0.6s ease-out',
          }}
        />
      )}
      <div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <CountdownTimer
          auctionEndTime={item.auctionEndTime}
          remainingMs={remainingMs}
          onEnd={() => {}}
        />
      </div>
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
        {item.title}
      </h3>
      <p style={{ margin: '0 0 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '1.25rem' }}>
        ${item.currentBid.toLocaleString()}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {isWinning && (
          <span
            style={{
              background: 'var(--win)',
              color: 'var(--bg)',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Winning
          </span>
        )}
        {outbid && !isWinning && (
          <span
            style={{
              background: 'var(--outbid)',
              color: 'var(--bg)',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Outbid
          </span>
        )}
        <BidButton
          disabled={ended || !connected}
          isWinning={isWinning}
          currentBid={item.currentBid}
          onBid={handleBid}
          loading={loading}
        />
      </div>
    </article>
  );
}
