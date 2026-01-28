/**
 * Socket handler for BID_PLACED. Validates payload and delegates to bidService.
 * Broadcasts UPDATE_BID to all clients on success, BID_REJECTED to sender on failure.
 */
import { processBid } from '../services/bidService.js';
import { logger } from '../utils/logger.js';

const BID_PLACED = 'BID_PLACED';
const UPDATE_BID = 'UPDATE_BID';
const BID_REJECTED = 'BID_REJECTED';

/**
 * Normalize and validate BID_PLACED payload. Returns { itemId, bidAmount, userId } or null.
 */
function parseBidPayload(data) {
  if (!data || typeof data !== 'object') return null;
  const itemId = typeof data.itemId === 'string' ? data.itemId.trim() : null;
  const bidAmount = typeof data.bidAmount === 'number' ? data.bidAmount : Number(data.bidAmount);
  const userId = typeof data.userId === 'string' ? data.userId.trim() : null;
  if (!itemId || !userId || Number.isNaN(bidAmount) || bidAmount <= 0) return null;
  return { itemId, bidAmount, userId };
}

/**
 * Register bid socket handler on the given io instance.
 * io: Socket.IO server
 */
export function registerBidHandler(io) {
  io.on('connection', (socket) => {
    socket.on(BID_PLACED, async (data) => {
      const parsed = parseBidPayload(data);
      if (!parsed) {
        socket.emit(BID_REJECTED, { reason: 'INVALID_BID' });
        return;
      }

      const { itemId, bidAmount, userId } = parsed;
      try {
        const result = await processBid(itemId, bidAmount, userId);

        if (result.accepted) {
          io.emit(UPDATE_BID, result.payload);
        } else {
          socket.emit(BID_REJECTED, { reason: result.rejectReason });
        }
      } catch (err) {
        logger.error('Bid processing error', { err: err.message, itemId, userId });
        socket.emit(BID_REJECTED, { reason: 'INVALID_BID' });
      }
    });
  });
}
