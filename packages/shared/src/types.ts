export type GamePhase =
  | "LOBBY"
  | "WORD_SELECTION"
  | "DRAWING"
  | "ROUND_REVEAL"
  | "SCOREBOARD"
  | "GAME_COMPLETE";

export type DrawTool = "pencil" | "brush" | "marker" | "eraser" | "fill";

/** Difficulty tier the host picks; word choices offered each turn are drawn from it. */
export type GameMode = "easy" | "medium" | "hard";

export interface Point {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
}

export interface Player {
  id: string;
  name: string;
  color: string;
  /** Encoded doodle-avatar config ("body-eyes-mouth-hat-color"), chosen client-side. */
  avatar: string;
  score: number;
  isHost: boolean;
  connected: boolean;
  streak: number;
  hasGuessedCorrectly: boolean;
  lastGuessMs: number | null;
}

/** Someone watching a game that started before they arrived; becomes a player when the room returns to the lobby. */
export interface Spectator {
  id: string;
  name: string;
  color: string;
  avatar: string;
  connected: boolean;
}

/**
 * How the turn that just ended was settled, for the reveal screen.
 * - artist_fault: nobody solved it, so nobody loses a streak.
 * - skipped: the guessers voted to skip an offline artist.
 * - artist_left: the artist left the room mid-turn.
 */
export type TurnOutcome = "artist_fault" | "skipped" | "artist_left";

/** Open while the artist is offline mid-turn; the turn is skipped once every online guesser votes yes. */
export interface SkipVote {
  artistName: string;
  votes: number;
  needed: number;
  youVoted: boolean;
  youCanVote: boolean;
}

export interface RoundStats {
  fastestGuesserId: string | null;
  fastestGuesserMs: number | null;
  mostChaoticDrawingId: string | null;
  worstArtistId: string | null;
}

export interface GameSettings {
  maxPlayers: number;
  totalRounds: number;
  drawSeconds: number;
  gameMode: GameMode;
  /** Longest a word prompt's phrase can be, in words (1/2/3) — see PROMPT_LENGTH_OPTIONS. */
  maxPromptWords: number;
}

export type GameSettingsUpdate = Partial<GameSettings>;

export interface GuessMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  text: string;
  correct: boolean;
  close: boolean;
  systemType?: "correct" | "join" | "leave" | "info";
  createdAt: number;
}

export interface ReactionEvent {
  id: string;
  playerId: string;
  emoji: string;
  createdAt: number;
}

export interface ScorePopup {
  id: string;
  playerId: string;
  amount: number;
  createdAt: number;
}

export interface EndGameAward {
  title: string;
  playerId: string | null;
  playerName: string | null;
  detail: string;
}

export interface StrokeStartOp {
  type: "start";
  strokeId: string;
  tool: DrawTool;
  color: string;
  size: number;
  point: Point;
}
export interface StrokePointOp {
  type: "point";
  strokeId: string;
  point: Point;
}
export interface StrokeEndOp {
  type: "end";
  strokeId: string;
}
export interface FillOp {
  type: "fill";
  color: string;
  point: Point;
}
export interface ClearOp {
  type: "clear";
}

export type DrawOp = StrokeStartOp | StrokePointOp | StrokeEndOp | FillOp | ClearOp;

/** State broadcast to every client; `word` is masked unless you are the artist, already guessed it, or the round has ended. */
export interface RoomSnapshot {
  code: string;
  phase: GamePhase;
  players: Player[];
  hostId: string | null;
  artistId: string | null;
  round: number;
  totalRounds: number;
  wordLength: number | null;
  revealedWord: string | null;
  wordChoices: string[] | null;
  phaseEndsAt: number | null;
  /** During DRAWING: when the pre-draw countdown ends and the pen goes live. */
  drawStartsAt: number | null;
  drawSeconds: number;
  guesses: GuessMessage[];
  awards: EndGameAward[] | null;
  settings: GameSettings;
  hintPattern: (string | null)[] | null;
  /** Set from the reveal until the next turn begins. */
  turnOutcome: TurnOutcome | null;
  skipVote: SkipVote | null;
  spectators: Spectator[];
  /** "spectator" means this viewer is watching a game in progress and can't guess or draw. */
  viewerRole: "player" | "spectator";
}

export interface CreateRoomPayload {
  nickname: string;
  avatar?: string;
}
export interface JoinRoomPayload {
  code: string;
  nickname: string;
  avatar?: string;
  sessionId?: string;
}
export interface JoinRoomResult {
  ok: boolean;
  error?: string;
  code?: string;
  sessionId?: string;
  playerId?: string;
  /** Joined a game already in progress as a watcher. */
  spectator?: boolean;
}

export interface ServerToClientEvents {
  room_state: (snapshot: RoomSnapshot) => void;
  draw_op: (op: DrawOp) => void;
  canvas_history: (ops: DrawOp[]) => void;
  guess_added: (message: GuessMessage) => void;
  score_popup: (popup: ScorePopup) => void;
  reaction: (event: ReactionEvent) => void;
  error_message: (message: string) => void;
  kicked: (reason: string) => void;
}

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload, cb: (res: JoinRoomResult) => void) => void;
  join_room: (payload: JoinRoomPayload, cb: (res: JoinRoomResult) => void) => void;
  rejoin_room: (payload: { code: string; sessionId: string }, cb: (res: JoinRoomResult) => void) => void;
  start_game: () => void;
  update_settings: (settings: GameSettingsUpdate) => void;
  select_word: (word: string) => void;
  submit_guess: (text: string) => void;
  send_reaction: (emoji: string) => void;
  draw_op: (op: DrawOp) => void;
  play_again: () => void;
  vote_skip_artist: () => void;
  leave_room: () => void;
}
