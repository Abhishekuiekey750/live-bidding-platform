/**
 * Express app: CORS, JSON, /items route.
 * Socket.io is attached in server.js.
 */
import express from 'express';
import cors from 'cors';
import itemsRouter from './routes/items.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
// Server time for client timer sync — single source of truth
app.get('/time', (req, res) => res.json({ serverTime: new Date().toISOString() }));
app.use('/items', itemsRouter);

export default app;
