/**
 * REST route: GET /items
 * Returns all items with server time as single source of truth.
 */
import { Router } from 'express';
import * as itemStore from '../store/items.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const list = itemStore.getAllItems();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
