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

## What makes it sticky

- **Doodle avatars** — build a character from shape, eyes, mouth, color and hat
  (`lib/avatar.ts`, `DoodleAvatar`). Hats unlock by level.
- **Progression** — XP, levels with titles, a daily play streak, a "daily double"
  on your first game each day, lifetime stats and 17 achievement stickers
  (`lib/progress.ts`). Stored in localStorage; no account needed.
- **Game feel** — confetti, screen shake, combo stamps that climb with your
  streak, count-up scores, and a synthesized sound set with a generated
  backing track (`lib/juice.ts`, `lib/audio/AudioManager.ts`). Music and
  effects have separate toggles.
- **Lobby doodle wall** — everyone can draw together while waiting.
- **End-of-game gallery** — every finished drawing is saved locally for
  download.
- **Drawing** — smoothed strokes, four brush sizes that scale with the canvas,
  a 20-color palette, and keyboard shortcuts (B/E/F, 1–4, [ ], Ctrl/⌘+Z).

## Notes on scope

A few things were intentionally simplified to keep this a real,
working vertical slice rather than a sprawling half-finished one:

- Progress (XP, streaks, achievements) lives in the browser, so it doesn't
  follow a player across devices.
- "Share Results" copies a text summary (or opens the share sheet on phones)
  rather than rendering a shareable image.
- Sound effects and music are synthesized with the Web Audio API, not sourced
  audio files — keeps the repo dependency-free.
- Rooms live in server memory (no database) — fine for the intended
  use case (a room that lives for one play session) but state is lost
  on server restart.
