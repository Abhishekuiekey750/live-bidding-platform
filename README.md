# Live Bidding Platform

Real-time auction platform where users place bids in the final seconds. Server-authoritative timing and bids, with correct handling of concurrent bids.

## Tech Stack

- **Backend:** Node.js, Express, Socket.io
- **Frontend:** React 18 (hooks), Vite
- **State sync:** Server time and bids are the single source of truth
- **Deployment:** Backend on [Render](https://render.com), Frontend on [Vercel](https://vercel.com)

---

## Setup

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

### Backend (local)

```bash
cd backend
npm install
npm run dev
```

Runs at **http://localhost:4000**.

### Frontend (local)

```bash
cd frontend
npm install
npm run dev
```

Runs at **http://localhost:3000** and proxies `/api` and Socket.io to the backend.

### Docker (backend only)

```bash
docker compose up --build
```

Backend at **http://localhost:4000**. Run the frontend locally as above and set proxy to `http://localhost:4000` (default in Vite config).

---

## Architecture

### Backend (`backend/src/`)

```
src/
├── server.js      # HTTP + Socket.io server
├── app.js         # Express app, CORS, routes
├── routes/        # REST (e.g. GET /items)
├── sockets/       # Socket handlers (BID_PLACED → UPDATE_BID / BID_REJECTED)
├── services/      # Bid processing (calls store under lock)
├── store/         # In-memory items + per-item lock
└── utils/         # Logger, etc.
```

- **REST**
  - `GET /items` — list items (id, title, startingPrice, currentBid, highestBidder, auctionEndTime).
  - `GET /time` — server time for client timer sync.
- **Sockets**
  - **Client → Server:** `BID_PLACED` — `{ itemId, bidAmount, userId }`.
  - **Server → All:** `UPDATE_BID` — `{ itemId, currentBid, highestBidder, serverTime }`.
  - **Server → Sender:** `BID_REJECTED` — `{ reason: "OUTBID" | "AUCTION_ENDED" | "INVALID_BID" }`.

### Concurrency handling (critical)

Bids for the same item are processed **one at a time** via a **per-item queue** in `store/itemLocks.js`:

1. For each `itemId`, a promise chain ensures all bid updates run sequentially.
2. When two `BID_PLACED` events arrive in the same millisecond for the same item, the first is applied; the second runs after it and sees the new `currentBid`, so it is rejected with **OUTBID**.
3. Validation (bid > currentBid, auction not ended) runs **inside** the lock, so there are no races on reads/updates.

We do **not** rely on client timestamps, client-side checks, or unsynchronized `if` checks. For multiple server instances, replace the in-memory lock with a distributed lock (e.g. Redis) or a single-writer queue so only one process applies bids per item.

### Frontend (`frontend/src/`)

```
src/
├── components/    # AuctionDashboard, ItemCard, CountdownTimer, BidButton
├── hooks/         # useItems, useServerTime
├── context/       # SocketContext (connection, subscribe, emit)
├── services/      # api (fetch items, server time), socket client
└── utils/         # config (API_BASE, SOCKET_URL)
```

- **Timer:** Uses `GET /time` and `serverTime` from `UPDATE_BID` to compute client–server drift. “Time left” is derived from server time, not from the client clock alone.
- **Real-time UX:** Green flash on `UPDATE_BID` for that item; “Winning” when `highestBidder === userId`; “Outbid” when the user was winning and someone else wins; bid button disabled when the auction has ended or (optionally) when the user is already winning.

---

## Deployment

### Backend (Render)

1. New **Web Service**, connect repo, root directory `backend` (or set build command to run from `backend`).
2. Build: `npm install` (or use a Dockerfile that builds the backend).
3. Start: `npm start` or `node src/server.js`.
4. Set env (see `backend/.env.example`):
   - `PORT` — Render sets this automatically.
   - `CORS_ORIGIN` — your frontend origin, e.g. `https://your-app.vercel.app`.
5. Use the Render URL as the backend base URL (e.g. `https://live-bidding-api.onrender.com`).
6. To use Docker on Render: set root directory to `backend` and use the provided `Dockerfile`.

### Frontend (Vercel)

1. Connect repo, root directory `frontend` (or project root with build set to `frontend`).
2. Build: `npm run build`; output directory: `dist`.
3. Env for production (see `frontend/.env.example`):
   - `VITE_API_URL` — backend REST base, e.g. `https://live-bidding-api.onrender.com`.
   - `VITE_SOCKET_URL` — backend URL for Socket.io (same host), e.g. `https://live-bidding-api.onrender.com`.
4. Deploy. Ensure the Render backend has `CORS_ORIGIN` set to your Vercel app URL.

---

## Non-functional notes

- **Concurrency:** Handled by per-item serialization in the backend; see “Concurrency handling” above.
- **Scale:** In-memory store and locks are single-machine. For 100+ connections and multi-instance deploy, add a datastore (e.g. Redis/Postgres) and distributed locking or a queue.
- **Robustness:** Invalid or missing fields in `BID_PLACED` result in `BID_REJECTED` with `INVALID_BID`; no crash. Socket reconnection and re-sync are left to the Socket.io client and your polling/sync of `/items` and `/time` if needed after reconnect.

---

## API summary

| Method | Path    | Description |
|--------|---------|-------------|
| GET    | /items  | List items (id, title, startingPrice, currentBid, highestBidder, auctionEndTime) |
| GET    | /time   | `{ serverTime: "ISO8601" }` for timer sync |
| GET    | /health | `{ ok: true, ts: "ISO8601" }` |

**Socket events:** see “Architecture” above.
