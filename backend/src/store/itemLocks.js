/**
 * CONCURRENCY: Per-item lock to serialize bid processing.
 *
 * Strategy: Queue-based serialization per itemId.
 * When two BID_PLACED events arrive at the same time for the same item,
 * they are processed one-after-one. The first bid updates currentBid;
 * the second runs after and sees the new currentBid, so it fails with OUTBID.
 *
 * We do NOT rely on client timing or simple if-checks. All bids for an item
 * are processed in a strict order; the in-memory lock guarantees that.
 *
 * For multi-instance deployment, replace this with Redis-backed distributed
 * locks (e.g. redis mutex) or use a single-writer queue (Redis list/stream)
 * so only one server processes bids per item.
 */
const itemChains = new Map();

/**
 * Run fn exclusively for the given itemId. Ensures only one bid processing
 * runs per item at a time. Returns the result of fn().
 */
export async function withItemLock(itemId, fn) {
  let chain = itemChains.get(itemId);
  if (!chain) {
    chain = Promise.resolve();
  }
  const ourWork = chain.then(fn).catch((err) => {
    throw err;
  });
  itemChains.set(itemId, ourWork);
  try {
    return await ourWork;
  } finally {
    if (itemChains.get(itemId) === ourWork) {
      itemChains.delete(itemId);
    }
  }
}
