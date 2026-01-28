/**
 * "Bid +$10" button. Disabled when auction ended or (optionally) when user is winning.
 */
const BID_INCREMENT = 10;

export function BidButton({
  disabled,
  isWinning,
  currentBid,
  onBid,
  loading,
}) {
  const amount = currentBid + BID_INCREMENT;
  const allowBid = !disabled && !isWinning;

  return (
    <button
      type="button"
      className="bid-button"
      disabled={!allowBid || loading}
      onClick={() => allowBid && onBid(amount)}
      style={{
        padding: '10px 16px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: '0.95rem',
        color: 'var(--bg)',
        background: allowBid ? 'var(--accent)' : 'var(--border)',
        border: 'none',
        borderRadius: 'var(--radius)',
        cursor: allowBid && !loading ? 'pointer' : 'not-allowed',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? '…' : `Bid $${amount}`}
    </button>
  );
}
