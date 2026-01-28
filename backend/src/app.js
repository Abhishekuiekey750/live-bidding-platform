/**
 * Express app: CORS, JSON, /items route.
 * Socket.io is attached in server.js.
 */
import express from 'express';
import cors from 'cors';
import itemsRouter from './routes/items.js';

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://live-bidding-platform-theta.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
// Server time for client timer sync — single source of truth
app.get('/time', (req, res) => res.json({ serverTime: new Date().toISOString() }));
app.use('/items', itemsRouter);

export default app;
