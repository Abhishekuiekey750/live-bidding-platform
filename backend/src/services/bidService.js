/**
 * Bid service: validates and applies bids under the per-item lock.
 * All bid logic runs inside withItemLock so race conditions are avoided.
 */
import * as itemStore from '../store/items.js';
import { withItemLock } from '../store/itemLocks.js';
import { logger } from '../utils/logger.js';

/**
 * Process a bid atomically for the given item.
 * Uses server time as single source of truth. Caller must not trust client timestamps.
 *
 * @returns {Promise<{ accepted: boolean, payload?: object, rejectReason?: string }>}
 */
export async function processBid(itemId, bidAmount, userId) {
  const serverTime = Date.now();

  return withItemLock(itemId, () => {
    const result = itemStore.updateBid(itemId, Number(bidAmount), userId, serverTime);

    if (result.success) {
      logger.info('Bid accepted', { itemId, userId, currentBid: result.updated.currentBid });
      return {
        accepted: true,
        payload: {
          itemId: result.updated.id,
          currentBid: result.updated.currentBid,
          highestBidder: result.updated.highestBidder,
          serverTime: new Date(serverTime).toISOString(),
        },
      };
    }

    logger.info('Bid rejected', { itemId, userId, reason: result.rejectReason });
    return {
      accepted: false,
      rejectReason: result.rejectReason,
    };
  });
}
