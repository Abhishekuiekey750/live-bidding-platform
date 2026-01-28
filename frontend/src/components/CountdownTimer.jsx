/**
 * Server-synced countdown. Derives remaining ms from server time, not client clock.
 */
import { useEffect, useState } from 'react';

const formatMs = (ms) => {
  if (ms <= 0) return 'Ended';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export function CountdownTimer({ auctionEndTime, remainingMs, onEnd }) {
  const [display, setDisplay] = useState('--:--');

  useEffect(() => {
    if (typeof remainingMs !== 'function') return;
    const left = remainingMs(auctionEndTime);
    setDisplay(formatMs(left));
    if (left <= 0) {
      onEnd?.();
      return;
    }
    const t = setInterval(() => {
      const next = remainingMs(auctionEndTime);
      setDisplay(formatMs(next));
      if (next <= 0) {
        onEnd?.();
        clearInterval(t);
      }
    }, 200);
    return () => clearInterval(t);
  }, [auctionEndTime, remainingMs, onEnd]);

  const ended = display === 'Ended';

  return (
    <span
      className="countdown"
      data-ended={ended || undefined}
      style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        color: ended ? 'var(--outbid)' : 'var(--accent)',
      }}
    >
      {display}
    </span>
  );
}
