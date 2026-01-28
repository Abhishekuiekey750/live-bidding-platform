/**
 * In-memory item store with server-authoritative state.
 * For production, replace with DB (Postgres/Redis) and use transactions or optimistic locking.
 */

const items = new Map();

/**
 * Seed items with end times in the future for demo.
 * auctionEndTime is set to now + 5 minutes so countdowns work out of the box.
 */
function seed() {
  const now = Date.now();
  const fiveMin = 5 * 60 * 1000;
  [
    { id: 'item-1', title: 'Vintage Rolex Submariner', startingPrice: 5000, currentBid: 5000, highestBidder: null, auctionEndTime: new Date(now + fiveMin).toISOString() },
    { id: 'item-2', title: 'Limited Art Print', startingPrice: 200, currentBid: 200, highestBidder: null, auctionEndTime: new Date(now + fiveMin + 60000).toISOString() },
    { id: 'item-3', title: 'Rare Comic #1', startingPrice: 1000, currentBid: 1000, highestBidder: null, auctionEndTime: new Date(now + fiveMin + 120000).toISOString() },
  ].forEach((item) => items.set(item.id, { ...item }));
}

seed();

/**
 * Get a shallow copy of all items. API returns exactly the fields required by spec.
 */
export function getAllItems() {
  const list = [];
  for (const item of items.values()) {
    list.push({
      id: item.id,
      title: item.title,
      startingPrice: item.startingPrice,
      currentBid: item.currentBid,
      highestBidder: item.highestBidder,
      auctionEndTime: item.auctionEndTime,
    });
  }
  return list;
}

/**
 * Get one item by id. Returns undefined if not found.
 */
export function getItem(id) {
  return items.get(id);
}

/**
 * Update bid for an item. Caller must hold the per-item lock (see bidService).
 * Returns { success: boolean, updated?: item, rejectReason?: 'OUTBID'|'AUCTION_ENDED'|'INVALID_BID' }
 */
export function updateBid(itemId, bidAmount, userId, serverTime) {
  const item = items.get(itemId);
  if (!item) {
    return { success: false, rejectReason: 'INVALID_BID' };
  }
  const endMs = new Date(item.auctionEndTime).getTime();
  if (serverTime >= endMs) {
    return { success: false, rejectReason: 'AUCTION_ENDED' };
  }
  if (bidAmount <= item.currentBid) {
    return { success: false, rejectReason: 'OUTBID' };
  }
  item.currentBid = bidAmount;
  item.highestBidder = userId;
  return {
    success: true,
    updated: {
      id: item.id,
      title: item.title,
      startingPrice: item.startingPrice,
      currentBid: item.currentBid,
      highestBidder: item.highestBidder,
      auctionEndTime: item.auctionEndTime,
    },
  };
}

export default { getAllItems, getItem, updateBid };
