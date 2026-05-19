# UNO Online — Real-time Multiplayer

Fully functional UNO card game with Socket.IO real-time multiplayer, supporting 2–4 players.

## Quick Start

```bash
# Install all dependencies
cd server && npm install
cd ../client && npm install

# Run both servers (dev mode)
# Terminal 1 — backend:
cd server && node index.js

# Terminal 2 — frontend:
cd client && npm run dev
```

Open `http://localhost:5173` in 2–4 browser tabs to play.

## Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| Frontend  | React 18 + Vite             |
| Backend   | Node.js + Express           |
| Real-time | Socket.IO                   |
| Styling   | Tailwind CSS + custom CSS   |

## Features

- Full official UNO rules (Skip, Reverse, Draw Two, Wild, Wild Draw Four)
- Wild Draw Four challenge system
- UNO call / catch mechanic
- Draw Two stacking (optional, toggle in lobby)
- 2–4 player rooms with 6-character codes
- Reconnection: seat held for 60s after disconnect
- Auto-advance turn for disconnected players (15s timer)
- In-game chat with system messages
- Round scoring + game winner detection
- Confetti win screen
- Color-blind mode with shape indicators
- Server-authoritative: no client-side cheat possible

## Production Build

```bash
cd client && npm run build
NODE_ENV=production node server/index.js
```

The Express server serves the built client at `http://localhost:3001`.

## Debug Mode

```bash
DEBUG=true node server/index.js
```

Logs full game state after each action.
