# INKRIOT

Draw. Guess. Chaos. A fast, social drawing-and-guessing party game — a
Skribbl.io-style game loop with an original visual identity.

## Structure

npm workspaces monorepo:

- `packages/shared` — types, constants, word list, scoring, room-code
  generation shared by client and server.
- `packages/server` — authoritative Socket.io game server. Owns room
  state, the round state machine (`LOBBY → WORD_SELECTION → DRAWING →
  ROUND_REVEAL → SCOREBOARD → GAME_COMPLETE`), timers, scoring, and
  guess validation. Clients are never trusted with the secret word,
  scores, or timers.
- `packages/client` — React + Vite + TypeScript frontend. Canvas
  drawing engine, Zustand stores, Framer Motion animations, a
  synthesized Web Audio sound system, and a custom cursor.

## Running locally

```bash
npm install
npm run build:shared   # shared must be built once before the server/client typecheck against it
npm run dev            # starts both the server (:4000) and client (:5173)
```

Or run them separately: `npm run dev:server` / `npm run dev:client`.

Open http://localhost:5173, create a room, and share the link/code.

## Notes on scope

A few things were intentionally simplified to keep this a real,
working vertical slice rather than a sprawling half-finished one:

- Avatars are a colored circle + initial (server-assigned color) —
  no custom avatar picker.
- "Share Results" copies a text summary to the clipboard rather than
  rendering a shareable image.
- Sound effects are synthesized with the Web Audio API (oscillators),
  not sourced audio files — keeps the repo dependency-free while still
  giving every interaction a distinct, on-brand sound.
- Rooms live in server memory (no database) — fine for the intended
  use case (a room that lives for one play session) but state is lost
  on server restart.
