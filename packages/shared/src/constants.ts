export const MAX_PLAYERS_PER_ROOM = 12;
export const MIN_PLAYERS_TO_START = 2;
export const ROOM_CODE_LENGTH = 4;

export const WORD_CHOICE_COUNT = 3;
export const WORD_SELECTION_SECONDS = 12;
export const ROUND_REVEAL_SECONDS = 4;
export const SCOREBOARD_SECONDS = 6;
export const POST_GAME_SECONDS = 30;

export const DEFAULT_ROUNDS = 3;
export const DEFAULT_DRAW_SECONDS = 80;
export const DEFAULT_MAX_PLAYERS = 8;
export const MIN_PLAYERS_PER_ROOM = 2;

export const PLAYERS_OPTIONS: number[] = Array.from(
  { length: MAX_PLAYERS_PER_ROOM - MIN_PLAYERS_PER_ROOM + 1 },
  (_, i) => i + MIN_PLAYERS_PER_ROOM,
);
export const DRAW_SECONDS_OPTIONS = [30, 45, 60, 80, 100, 120] as const;
export const ROUNDS_OPTIONS = [1, 2, 3, 4, 5] as const;
export const GAME_MODE_OPTIONS = [
  { value: "normal", label: "Normal" },
] as const;

export const MAX_POINTS = 1000;
export const MIN_POINTS = 100;
export const ARTIST_POINTS_PER_GUESSER = 120;
export const STREAK_BONUS_PER_LEVEL = 25;
export const MAX_STREAK_BONUS = 150;

export const MAX_GUESS_LENGTH = 40;
export const MAX_NICKNAME_LENGTH = 16;
export const MAX_CHAT_HISTORY = 60;

export const ROOM_IDLE_EXPIRY_MS = 1000 * 60 * 30;
export const RECONNECT_GRACE_MS = 1000 * 45;

/** Name colors in chat/feeds — all dark enough to read on white paper. */
export const AVATAR_COLORS = [
  "#E0401F",
  "#6A4BF0",
  "#0E86D4",
  "#D12F87",
  "#0F9468",
  "#C9680F",
  "#9B2FD6",
  "#B8860B",
] as const;

export const REACTIONS = ["😂", "🔥", "💀", "👏", "😭", "🤯", "🎨", "👀"] as const;

/** Avatar strings are five dash-separated small integers; anything else is dropped server-side. */
export const AVATAR_PATTERN = /^\d{1,2}(-\d{1,2}){4}$/;
/** Max ops kept for the lobby doodle wall so late joiners get a bounded replay. */
export const LOBBY_WALL_MAX_OPS = 4000;
