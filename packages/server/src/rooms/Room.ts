import { Server } from "socket.io";
import { nanoid } from "nanoid";
import {
  AVATAR_COLORS,
  AVATAR_PATTERN,
  ClientToServerEvents,
  DEFAULT_DRAW_SECONDS,
  DRAW_COUNTDOWN_MS,
  DEFAULT_GAME_MODE,
  DEFAULT_PROMPT_LENGTH,
  DEFAULT_MAX_PLAYERS,
  DEFAULT_ROUNDS,
  DRAW_SECONDS_OPTIONS,
  DrawOp,
  EndGameAward,
  GameMode,
  GameSettingsUpdate,
  GamePhase,
  GuessMessage,
  HOST_HANDOFF_MS,
  MAX_CHAT_HISTORY,
  MAX_GUESS_LENGTH,
  MAX_NICKNAME_LENGTH,
  MAX_PLAYERS_PER_ROOM,
  MAX_SPECTATORS,
  MIN_PLAYERS_PER_ROOM,
  LOBBY_WALL_MAX_OPS,
  Player,
  REACTIONS,
  RECONNECT_GRACE_MS,
  ROUNDS_OPTIONS,
  ROUND_REVEAL_SECONDS,
  RoomSnapshot,
  SCOREBOARD_SECONDS,
  ServerToClientEvents,
  Spectator,
  TurnOutcome,
  WORD_CHOICE_COUNT,
  PROMPT_LENGTH_OPTIONS,
  RECENT_WORDS_MEMORY,
  WORD_SELECTION_SECONDS,
  artistPoints,
  baseGuesserPoints,
  buildHintPattern,
  chooseHintIndices,
  guesserPoints,
  hintTargetCount,
  isCloseGuess,
  isCorrectGuess,
  letterIndices,
  pickRandomWords,
} from "@inkriot/shared";

interface InternalPlayer extends Player {
  socketId: string | null;
  sessionId: string;
  wrongGuessesThisRound: number;
}

interface InternalSpectator extends Spectator {
  socketId: string | null;
  sessionId: string;
}

interface ArtistTurnStats {
  artistId: string;
  drawOpCount: number;
  correctGuesserCount: number;
}

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;

export class Room {
  code: string;
  io: IOServer;
  players = new Map<string, InternalPlayer>();
  /** Watchers of a game that started before they arrived; promoted to players when the room returns to the lobby. */
  spectators = new Map<string, InternalSpectator>();
  /** Session -> id, for both players and spectators. */
  sessionToPlayer = new Map<string, string>();
  hostId: string | null = null;
  phase: GamePhase = "LOBBY";
  round = 0;
  totalRounds = DEFAULT_ROUNDS;
  drawSeconds = DEFAULT_DRAW_SECONDS;
  maxPlayers = DEFAULT_MAX_PLAYERS;
  gameMode: GameMode = DEFAULT_GAME_MODE;
  maxPromptWords = DEFAULT_PROMPT_LENGTH;
  artistOrder: string[] = [];
  turnIndex = -1;
  artistId: string | null = null;
  currentWord: string | null = null;
  wordChoices: string[] | null = null;
  usedWords = new Set<string>();
  /** Survives rematches, so a room of regulars doesn't keep drawing the same prompts. */
  private recentWords: string[] = [];
  canvasOps: DrawOp[] = [];
  guesses: GuessMessage[] = [];
  phaseEndsAt: number | null = null;
  drawStartsAt: number | null = null;
  awards: EndGameAward[] | null = null;
  lastActivityAt = Date.now();

  private phaseTimer: NodeJS.Timeout | null = null;
  private hintTimers: NodeJS.Timeout[] = [];
  private hintRevealedIndices = new Set<number>();
  private disconnectTimers = new Map<string, NodeJS.Timeout>();
  private turnStats: ArtistTurnStats[] = [];
  private fastestGuess: { playerId: string; ms: number } | null = null;
  private mostWrongGuesses: { playerId: string; count: number } | null = null;
  private scoreAtRoundOneEnd = new Map<string, number>();
  /** This turn's correct guesses in the order they landed, with their streak-free base points. */
  private solves: { playerId: string; base: number }[] = [];
  /** Guessers who were offline at any point this turn: not counted against the artist's pay (they still lose their streak). */
  private offlineThisTurn = new Set<string>();
  private turnOutcome: TurnOutcome | null = null;
  private skipVotes = new Set<string>();
  private hostHandoffTimer: NodeJS.Timeout | null = null;
  private onEmpty: () => void;

  constructor(code: string, io: IOServer, onEmpty: () => void) {
    this.code = code;
    this.io = io;
    this.onEmpty = onEmpty;
  }

  private touch() {
    this.lastActivityAt = Date.now();
  }

  private nextColor(): string {
    const used = new Set(Array.from(this.players.values()).map((p) => p.color));
    return AVATAR_COLORS.find((c) => !used.has(c)) ?? AVATAR_COLORS[this.players.size % AVATAR_COLORS.length];
  }

  addPlayer(
    nickname: string,
    socketId: string,
    avatar?: string,
  ): { playerId: string; sessionId: string; spectator?: boolean } | { error: string } {
    this.touch();
    const inGame = this.phase !== "LOBBY";
    if (!inGame && this.players.size >= this.maxPlayers) return { error: "Room is full." };
    if (inGame && this.spectators.size >= MAX_SPECTATORS) return { error: "This room already has a full crowd watching." };

    const cleanName = nickname.trim().slice(0, MAX_NICKNAME_LENGTH) || "Player";
    const existingNames = new Set([
      ...Array.from(this.players.values()).map((p) => p.name.toLowerCase()),
      ...Array.from(this.spectators.values()).map((p) => p.name.toLowerCase()),
    ]);
    let finalName = cleanName;
    let suffix = 2;
    while (existingNames.has(finalName.toLowerCase())) {
      finalName = `${cleanName} (${suffix++})`;
    }

    const playerId = nanoid(10);
    const sessionId = nanoid(21);
    if (inGame) {
      this.spectators.set(playerId, {
        id: playerId,
        name: finalName,
        color: this.nextColor(),
        avatar: typeof avatar === "string" && AVATAR_PATTERN.test(avatar) ? avatar : "",
        connected: true,
        socketId,
        sessionId,
      });
      this.sessionToPlayer.set(sessionId, playerId);
      return { playerId, sessionId, spectator: true };
    }
    const isHost = this.players.size === 0;
    const player: InternalPlayer = {
      id: playerId,
      name: finalName,
      color: this.nextColor(),
      avatar: typeof avatar === "string" && AVATAR_PATTERN.test(avatar) ? avatar : "",
      score: 0,
      isHost,
      connected: true,
      streak: 0,
      hasGuessedCorrectly: false,
      lastGuessMs: null,
      socketId,
      sessionId,
      wrongGuessesThisRound: 0,
    };
    this.players.set(playerId, player);
    this.sessionToPlayer.set(sessionId, playerId);
    if (isHost) this.hostId = playerId;
    return { playerId, sessionId };
  }

  reconnectPlayer(sessionId: string, socketId: string): { playerId: string } | { error: string } {
    const playerId = this.sessionToPlayer.get(sessionId);
    if (!playerId) return { error: "Session not found." };
    const player = this.players.get(playerId);
    const spectator = this.spectators.get(playerId);
    if (!player && !spectator) return { error: "Session not found." };
    if (player) {
      player.connected = true;
      player.socketId = socketId;
    } else if (spectator) {
      spectator.connected = true;
      spectator.socketId = socketId;
    }
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }
    if (this.hostId === playerId && this.hostHandoffTimer) {
      clearTimeout(this.hostHandoffTimer);
      this.hostHandoffTimer = null;
    }
    // The artist is back, or the set of voters changed; the caller broadcasts afterwards.
    this.checkSkipVote(false);
    this.touch();
    return { playerId };
  }

  markDisconnected(playerId: string) {
    const spectator = this.spectators.get(playerId);
    const player = this.players.get(playerId);
    if (!player && !spectator) return;
    if (player) {
      player.connected = false;
      player.socketId = null;
      if (this.phase === "WORD_SELECTION" || this.phase === "DRAWING") this.offlineThisTurn.add(playerId);
      if (this.hostId === playerId) {
        if (this.hostHandoffTimer) clearTimeout(this.hostHandoffTimer);
        this.hostHandoffTimer = setTimeout(() => this.handOffHost(playerId), HOST_HANDOFF_MS);
      }
    } else if (spectator) {
      spectator.connected = false;
      spectator.socketId = null;
    }

    const timer = setTimeout(() => this.removePlayer(playerId), RECONNECT_GRACE_MS);
    this.disconnectTimers.set(playerId, timer);
    this.checkSkipVote(false);
    this.broadcastState();
  }

  /** A host who stays offline hands the room to someone present; if they come back they're a regular player. */
  private handOffHost(fromId: string) {
    this.hostHandoffTimer = null;
    const from = this.players.get(fromId);
    if (this.hostId !== fromId || !from || from.connected) return;
    const next = Array.from(this.players.values()).find((p) => p.connected && p.id !== fromId);
    if (!next) return;
    from.isHost = false;
    next.isHost = true;
    this.hostId = next.id;
    this.broadcastState();
  }

  removePlayer(playerId: string) {
    const timer = this.disconnectTimers.get(playerId);
    if (timer) clearTimeout(timer);
    this.disconnectTimers.delete(playerId);

    const spectator = this.spectators.get(playerId);
    if (spectator) {
      this.spectators.delete(playerId);
      this.sessionToPlayer.delete(spectator.sessionId);
      this.broadcastState();
      return;
    }

    const player = this.players.get(playerId);
    if (!player) return;
    this.players.delete(playerId);
    this.sessionToPlayer.delete(player.sessionId);
    this.artistOrder = this.artistOrder.filter((id) => id !== playerId);
    this.skipVotes.delete(playerId);
    if (this.hostId === playerId && this.hostHandoffTimer) {
      clearTimeout(this.hostHandoffTimer);
      this.hostHandoffTimer = null;
    }

    // Everyone seated left but people are still watching: they take over the room.
    if (this.players.size === 0 && this.spectators.size > 0) this.resetToLobby();

    if (this.players.size === 0) {
      this.clearPhaseTimer();
      this.clearHintTimers();
      this.onEmpty();
      return;
    }

    if (this.hostId === playerId) {
      const next = Array.from(this.players.values()).find((p) => p.connected) ?? Array.from(this.players.values())[0];
      this.hostId = next.id;
      next.isHost = true;
    }

    const inGame = this.phase !== "LOBBY" && this.phase !== "GAME_COMPLETE";
    if (inGame && this.players.size < MIN_PLAYERS_PER_ROOM) {
      this.addSystemMessage("Everyone else left — back to the lobby.");
      this.resetToLobby();
      return;
    }

    if (this.artistId === playerId && (this.phase === "DRAWING" || this.phase === "WORD_SELECTION")) {
      this.addSystemMessage(`${player.name} left mid-turn — skipping to next round.`);
      this.clearPhaseTimer();
      this.endRound("artist_left");
    } else if (this.phase === "DRAWING" && this.everyoneGuessedOrArtistOnly()) {
      this.clearPhaseTimer();
      this.endRound();
    } else {
      this.checkSkipVote(false);
      this.broadcastState();
    }
  }

  /** Spectators of the finished game sit down as players, as long as there are seats. */
  private promoteSpectators() {
    for (const spectator of Array.from(this.spectators.values())) {
      if (this.players.size >= this.maxPlayers) break;
      this.spectators.delete(spectator.id);
      const player: InternalPlayer = {
        id: spectator.id,
        name: spectator.name,
        color: spectator.color,
        avatar: spectator.avatar,
        score: 0,
        isHost: false,
        connected: spectator.connected,
        streak: 0,
        hasGuessedCorrectly: false,
        lastGuessMs: null,
        socketId: spectator.socketId,
        sessionId: spectator.sessionId,
        wrongGuessesThisRound: 0,
      };
      this.players.set(player.id, player);
    }
    if (!this.hostId || !this.players.has(this.hostId)) {
      const next = Array.from(this.players.values()).find((p) => p.connected) ?? Array.from(this.players.values())[0];
      if (next) {
        next.isHost = true;
        this.hostId = next.id;
      }
    }
  }

  /**
   * The artist is offline mid-turn: guessers who are online can vote to skip. Once every
   * online guesser has said yes the turn is skipped — no points, no streaks lost.
   */
  private skipVoteOpen(): boolean {
    const artist = this.artistId ? this.players.get(this.artistId) : null;
    return !!artist && !artist.connected && (this.phase === "WORD_SELECTION" || this.phase === "DRAWING");
  }

  private skipVoters(): InternalPlayer[] {
    return Array.from(this.players.values()).filter((p) => p.id !== this.artistId && p.connected);
  }

  voteSkipArtist(playerId: string) {
    if (!this.skipVoteOpen()) return;
    if (!this.skipVoters().some((p) => p.id === playerId)) return;
    this.skipVotes.add(playerId);
    this.touch();
    this.checkSkipVote(true);
  }

  private checkSkipVote(broadcast: boolean) {
    if (!this.skipVoteOpen()) {
      this.skipVotes.clear();
      return;
    }
    const voters = this.skipVoters();
    for (const id of Array.from(this.skipVotes)) if (!voters.some((p) => p.id === id)) this.skipVotes.delete(id);
    if (voters.length > 0 && voters.every((p) => this.skipVotes.has(p.id))) {
      const artist = this.artistId ? this.players.get(this.artistId) : null;
      this.addSystemMessage(`${artist?.name ?? "The artist"} was offline — turn skipped.`);
      this.clearPhaseTimer();
      this.endRound("skipped");
      return;
    }
    if (broadcast) this.broadcastState();
  }

  isHost(playerId: string) {
    return this.hostId === playerId;
  }

  updateSettings(playerId: string, update: GameSettingsUpdate) {
    if (!this.isHost(playerId) || this.phase !== "LOBBY") return;
    this.touch();
    if (update.maxPlayers !== undefined) {
      const clamped = Math.round(update.maxPlayers);
      if (clamped >= Math.max(MIN_PLAYERS_PER_ROOM, this.players.size) && clamped <= MAX_PLAYERS_PER_ROOM) {
        this.maxPlayers = clamped;
      }
    }
    if (update.drawSeconds !== undefined && (DRAW_SECONDS_OPTIONS as readonly number[]).includes(update.drawSeconds)) {
      this.drawSeconds = update.drawSeconds;
    }
    if (update.totalRounds !== undefined && (ROUNDS_OPTIONS as readonly number[]).includes(update.totalRounds)) {
      this.totalRounds = update.totalRounds;
    }
    if (update.gameMode !== undefined && (["easy", "medium", "hard"] as GameMode[]).includes(update.gameMode)) {
      this.gameMode = update.gameMode;
    }
    if (update.maxPromptWords !== undefined && (PROMPT_LENGTH_OPTIONS as readonly number[]).includes(update.maxPromptWords)) {
      this.maxPromptWords = update.maxPromptWords;
    }
    this.broadcastState();
  }

  startGame() {
    if (this.phase !== "LOBBY") return;
    if (this.players.size < 1) return;
    this.round = 0;
    this.turnIndex = -1;
    this.usedWords.clear();
    for (const p of this.players.values()) {
      p.score = 0;
      p.streak = 0;
    }
    this.artistOrder = Array.from(this.players.keys());
    this.turnStats = [];
    this.fastestGuess = null;
    this.mostWrongGuesses = null;
    this.awards = null;
    this.beginNextTurn();
  }

  private beginNextTurn() {
    this.turnIndex++;
    if (this.turnIndex >= this.artistOrder.length) {
      this.turnIndex = 0;
      this.round++;
      if (this.round > 0) this.snapshotRoundOneScores();
    }
    if (this.round === 0) this.round = 1;

    if (this.round > this.totalRounds) {
      this.endGame();
      return;
    }

    const candidateId = this.artistOrder[this.turnIndex];
    const artist = candidateId ? this.players.get(candidateId) : null;
    if (!artist || !artist.connected) {
      if (this.artistOrder.every((id) => !this.players.get(id)?.connected)) {
        this.endGame();
        return;
      }
      this.beginNextTurn();
      return;
    }

    this.artistId = artist.id;
    this.currentWord = null;
    const seen = new Set([...this.usedWords, ...this.recentWords]);
    this.wordChoices = pickRandomWords(WORD_CHOICE_COUNT, seen, this.gameMode, this.maxPromptWords);
    this.canvasOps = [];
    this.guesses = [];
    this.solves = [];
    this.turnOutcome = null;
    this.skipVotes.clear();
    this.offlineThisTurn = new Set(Array.from(this.players.values()).filter((p) => !p.connected).map((p) => p.id));
    for (const p of this.players.values()) {
      p.hasGuessedCorrectly = false;
      p.wrongGuessesThisRound = 0;
    }
    this.turnStats.push({ artistId: artist.id, drawOpCount: 0, correctGuesserCount: 0 });
    this.setPhase("WORD_SELECTION", WORD_SELECTION_SECONDS * 1000, () => {
      const auto = this.wordChoices?.[0];
      if (auto) this.selectWord(this.artistId!, auto);
    });
  }

  selectWord(playerId: string, word: string) {
    if (this.phase !== "WORD_SELECTION" || playerId !== this.artistId) return;
    if (!this.wordChoices?.includes(word)) return;
    this.currentWord = word;
    this.usedWords.add(word);
    this.rememberWord(word);
    this.wordChoices = null;
    this.clearPhaseTimer();
    // The phase covers the "3, 2, 1, GO!" plus the full draw time; the clock players
    // see (and scoring) only starts once the countdown is over.
    this.drawStartsAt = Date.now() + DRAW_COUNTDOWN_MS;
    this.hintRevealedIndices.clear();
    this.setPhase("DRAWING", DRAW_COUNTDOWN_MS + this.drawSeconds * 1000, () => this.endRound());
    this.scheduleHints();
  }

  private rememberWord(word: string) {
    this.recentWords = this.recentWords.filter((w) => w !== word);
    this.recentWords.push(word);
    if (this.recentWords.length > RECENT_WORDS_MEMORY) this.recentWords.shift();
  }

  private scheduleHints() {
    this.clearHintTimers();
    this.hintRevealedIndices.clear();
    if (!this.currentWord) return;
    const word = this.currentWord;
    const total = letterIndices(word).length;

    const drawMs = this.drawSeconds * 1000;
    const reveal = (stage: 1 | 2) => {
      // Guard against a stale timer firing into a different turn.
      if (this.phase !== "DRAWING" || this.currentWord !== word) return;
      const need = hintTargetCount(total, stage) - this.hintRevealedIndices.size;
      if (need <= 0) return;
      for (const i of chooseHintIndices(word, this.hintRevealedIndices, need)) this.hintRevealedIndices.add(i);
      this.broadcastState();
    };

    // First hint at the halfway mark, second at three-quarters — measured from when
    // the pen goes live, not from the countdown.
    this.hintTimers.push(setTimeout(() => reveal(1), DRAW_COUNTDOWN_MS + drawMs * 0.5));
    this.hintTimers.push(setTimeout(() => reveal(2), DRAW_COUNTDOWN_MS + drawMs * 0.75));
  }

  private clearHintTimers() {
    for (const t of this.hintTimers) clearTimeout(t);
    this.hintTimers = [];
  }

  handleDrawOp(playerId: string, op: DrawOp) {
    if (this.phase === "LOBBY") return this.handleLobbyWallOp(playerId, op);
    if (playerId !== this.artistId || this.phase !== "DRAWING") return;
    // Small tolerance for clock skew between the artist's countdown and ours.
    if (this.drawStartsAt && Date.now() < this.drawStartsAt - 400) return;
    this.touch();
    if (op.type === "clear") {
      this.canvasOps = [];
    } else {
      this.canvasOps.push(op);
      if (this.canvasOps.length > 6000) this.canvasOps.shift();
    }
    const stats = this.turnStats[this.turnStats.length - 1];
    if (stats && (op.type === "start" || op.type === "fill")) stats.drawOpCount++;
    for (const p of this.players.values()) {
      if (p.id !== playerId && p.socketId) this.io.to(p.socketId).emit("draw_op", op);
    }
    for (const w of this.spectators.values()) {
      if (w.socketId) this.io.to(w.socketId).emit("draw_op", op);
    }
  }

  /**
   * In the lobby everyone shares one doodle wall. Strokes only (no fill/clear) so one
   * player can't wipe everyone else's art; the host gets a clear via `clearLobbyWall`.
   */
  private handleLobbyWallOp(playerId: string, op: DrawOp) {
    if (op.type === "fill") return;
    if (op.type === "clear") {
      if (!this.isHost(playerId)) return;
      this.canvasOps = [];
    } else {
      this.canvasOps.push(op);
      if (this.canvasOps.length > LOBBY_WALL_MAX_OPS) this.canvasOps.shift();
    }
    this.touch();
    for (const p of this.players.values()) {
      if (p.id !== playerId && p.socketId) this.io.to(p.socketId).emit("draw_op", op);
    }
  }

  handleGuess(playerId: string, rawText: string) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== "DRAWING" || !this.currentWord) return;
    if (playerId === this.artistId || player.hasGuessedCorrectly) return;
    const text = rawText.trim().slice(0, MAX_GUESS_LENGTH);
    if (!text) return;
    this.touch();

    const correct = isCorrectGuess(text, this.currentWord);
    const close = !correct && isCloseGuess(text, this.currentWord);

    const message: GuessMessage = {
      id: nanoid(8),
      playerId,
      playerName: player.name,
      playerColor: player.color,
      text: correct ? "guessed the word!" : text,
      correct,
      close,
      systemType: correct ? "correct" : undefined,
      createdAt: Date.now(),
    };

    if (correct) {
      player.hasGuessedCorrectly = true;
      player.streak++;
      const drawMs = this.drawSeconds * 1000;
      const remainingMs = Math.min(drawMs, Math.max(0, (this.phaseEndsAt ?? Date.now()) - Date.now()));
      const points = guesserPoints(remainingMs, drawMs, player.streak);
      player.score += points;
      player.lastGuessMs = drawMs - remainingMs;
      this.solves.push({ playerId, base: baseGuesserPoints(remainingMs, drawMs) });

      if (!this.fastestGuess || player.lastGuessMs < this.fastestGuess.ms) {
        this.fastestGuess = { playerId, ms: player.lastGuessMs };
      }
      const stats = this.turnStats[this.turnStats.length - 1];
      if (stats) stats.correctGuesserCount++;

      this.io.to(this.code).emit("score_popup", { id: nanoid(6), playerId, amount: points, createdAt: Date.now() });
      this.pushGuess(message);

      if (this.everyoneGuessedOrArtistOnly()) {
        this.clearPhaseTimer();
        this.endRound();
      } else {
        this.broadcastState();
      }
    } else {
      // A wrong guess never costs the streak — it only breaks if you miss the word entirely.
      player.wrongGuessesThisRound++;
      if (!this.mostWrongGuesses || player.wrongGuessesThisRound > this.mostWrongGuesses.count) {
        this.mostWrongGuesses = { playerId, count: player.wrongGuessesThisRound };
      }
      this.pushGuess(message);
    }
  }

  private everyoneGuessedOrArtistOnly(): boolean {
    const guessers = Array.from(this.players.values()).filter((p) => p.id !== this.artistId && p.connected);
    if (guessers.length === 0) return false;
    return guessers.every((p) => p.hasGuessedCorrectly);
  }

  private pushGuess(message: GuessMessage) {
    this.guesses.push(message);
    if (this.guesses.length > MAX_CHAT_HISTORY) this.guesses.shift();
    this.io.to(this.code).emit("guess_added", message);
    if (message.correct) this.broadcastState();
  }

  addSystemMessage(text: string) {
    const message: GuessMessage = {
      id: nanoid(8),
      playerId: "system",
      playerName: "INKRIOT",
      playerColor: "#11100E",
      text,
      correct: false,
      close: false,
      systemType: "info",
      createdAt: Date.now(),
    };
    this.pushGuess(message);
  }

  sendReaction(playerId: string, emoji: string) {
    const player = this.players.get(playerId);
    if (!player || !(REACTIONS as readonly string[]).includes(emoji)) return;
    this.io.to(this.code).emit("reaction", { id: nanoid(6), playerId, emoji, createdAt: Date.now() });
  }

  /**
   * `voided` turns (offline artist skipped by vote, or the artist left) pay nobody and
   * cost nobody a streak. Otherwise the artist is paid from how the guessers did, and a
   * guesser who missed the word loses their streak (offline or not) — unless nobody got
   * it, which is on the artist.
   */
  private endRound(voided?: "skipped" | "artist_left") {
    if (this.phase === "ROUND_REVEAL" || this.phase === "SCOREBOARD") return;
    this.clearHintTimers();
    this.drawStartsAt = null;
    this.skipVotes.clear();

    if (voided) {
      this.turnOutcome = voided;
    } else {
      const solvedIds = new Set(this.solves.map((s) => s.playerId));
      const missed = Array.from(this.players.values()).filter((p) => p.id !== this.artistId && !solvedIds.has(p.id));
      // Missing the word costs the streak whether you were offline or not, so dropping the
      // connection can't protect it. Only the artist's pay ignores people who were offline.
      const countedAgainstArtist = missed.filter((p) => !this.offlineThisTurn.has(p.id));
      if (this.solves.length === 0) {
        this.turnOutcome = "artist_fault";
      } else {
        for (const p of missed) p.streak = 0;
        const artist = this.artistId ? this.players.get(this.artistId) : null;
        if (artist) {
          const points = artistPoints(
            this.solves.map((s) => s.base),
            this.solves.length + countedAgainstArtist.length,
            this.players.size,
          );
          artist.score += points;
          if (points > 0) {
            this.io.to(this.code).emit("score_popup", { id: nanoid(6), playerId: artist.id, amount: points, createdAt: Date.now() });
          }
        }
      }
    }
    this.setPhase("ROUND_REVEAL", ROUND_REVEAL_SECONDS * 1000, () => {
      this.setPhase("SCOREBOARD", SCOREBOARD_SECONDS * 1000, () => this.beginNextTurn());
    });
  }

  private snapshotRoundOneScores() {
    if (this.scoreAtRoundOneEnd.size > 0) return;
    for (const p of this.players.values()) this.scoreAtRoundOneEnd.set(p.id, p.score);
  }

  private endGame() {
    this.clearPhaseTimer();
    this.clearHintTimers();
    this.drawStartsAt = null;
    this.artistId = null;
    this.currentWord = null;
    this.wordChoices = null;
    this.awards = this.computeAwards();
    this.phase = "GAME_COMPLETE";
    this.phaseEndsAt = null;
    this.broadcastState();
  }

  private computeAwards(): EndGameAward[] {
    const awards: EndGameAward[] = [];
    const nameOf = (id: string | null) => (id ? this.players.get(id)?.name ?? null : null);

    if (this.fastestGuess) {
      awards.push({
        title: "Fastest Guesser",
        playerId: this.fastestGuess.playerId,
        playerName: nameOf(this.fastestGuess.playerId),
        detail: `${(this.fastestGuess.ms / 1000).toFixed(1)}s reaction time`,
      });
    }

    const chaos = [...this.turnStats].sort((a, b) => b.drawOpCount - a.drawOpCount)[0];
    if (chaos && chaos.drawOpCount > 0) {
      awards.push({
        title: "Most Chaotic Drawing",
        playerId: chaos.artistId,
        playerName: nameOf(chaos.artistId),
        detail: `${chaos.drawOpCount} stroke${chaos.drawOpCount === 1 ? "" : "s"} of pure chaos`,
      });
    }

    const drawn = this.turnStats.filter((s) => s.drawOpCount > 0);
    const worst = [...drawn].sort((a, b) => a.correctGuesserCount - b.correctGuesserCount)[0];
    const best = Math.max(0, ...drawn.map((s) => s.correctGuesserCount));
    // Only crown a "worst" artist if their drawing actually did worse than someone else's.
    if (worst && (worst.correctGuesserCount === 0 || worst.correctGuesserCount < best)) {
      awards.push({
        title: "Worst Artist",
        playerId: worst.artistId,
        playerName: nameOf(worst.artistId),
        detail: worst.correctGuesserCount === 0 ? "Nobody guessed it. Nobody." : `Only ${worst.correctGuesserCount} correct guess${worst.correctGuesserCount === 1 ? "" : "es"}`,
      });
    }

    if (this.mostWrongGuesses && this.mostWrongGuesses.count >= 3) {
      awards.push({
        title: "Most Confident Wrong Guesser",
        playerId: this.mostWrongGuesses.playerId,
        playerName: nameOf(this.mostWrongGuesses.playerId),
        detail: `${this.mostWrongGuesses.count} confidently incorrect guesses`,
      });
    }

    let bestComebackId: string | null = null;
    let bestJump = 0;
    const ranked = (scores: Map<string, number>) =>
      Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).map(([id]) => id);
    const earlyRank = ranked(this.scoreAtRoundOneEnd);
    const finalScores = new Map(Array.from(this.players.values()).map((p) => [p.id, p.score]));
    const finalRank = ranked(finalScores);
    for (const id of earlyRank) {
      const jump = earlyRank.indexOf(id) - finalRank.indexOf(id);
      if (jump > bestJump) {
        bestJump = jump;
        bestComebackId = id;
      }
    }
    if (bestComebackId && bestJump > 0) {
      awards.push({
        title: "Best Comeback",
        playerId: bestComebackId,
        playerName: nameOf(bestComebackId),
        detail: `Climbed ${bestJump} place${bestJump > 1 ? "s" : ""} in the final stretch`,
      });
    }

    return awards;
  }

  playAgain(playerId: string) {
    if (!this.isHost(playerId)) return;
    this.resetToLobby();
  }

  private resetToLobby() {
    this.clearPhaseTimer();
    this.clearHintTimers();
    this.hintRevealedIndices.clear();
    this.drawStartsAt = null;
    this.phase = "LOBBY";
    this.round = 0;
    this.turnIndex = -1;
    this.artistId = null;
    this.currentWord = null;
    this.wordChoices = null;
    this.canvasOps = [];
    this.guesses = [];
    this.solves = [];
    this.turnOutcome = null;
    this.skipVotes.clear();
    this.awards = null;
    this.phaseEndsAt = null;
    this.scoreAtRoundOneEnd.clear();
    for (const p of this.players.values()) {
      p.score = 0;
      p.streak = 0;
      p.hasGuessedCorrectly = false;
    }
    this.promoteSpectators();
    this.broadcastState();
  }

  private setPhase(phase: GamePhase, durationMs: number, onEnd: () => void) {
    this.clearPhaseTimer();
    this.phase = phase;
    this.phaseEndsAt = Date.now() + durationMs;
    this.phaseTimer = setTimeout(() => {
      this.phaseTimer = null;
      onEnd();
    }, durationMs);
    this.broadcastState();
  }

  private clearPhaseTimer() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  getCanvasOps(): DrawOp[] {
    return this.canvasOps;
  }

  getSnapshot(forPlayerId: string): RoomSnapshot {
    const open = this.skipVoteOpen();
    const voters = open ? this.skipVoters() : [];
    const isArtist = forPlayerId === this.artistId;
    const solved = this.phase === "DRAWING" && !!this.players.get(forPlayerId)?.hasGuessedCorrectly;
    const revealArtist = this.phase === "ROUND_REVEAL" || this.phase === "SCOREBOARD" || this.phase === "GAME_COMPLETE";
    return {
      code: this.code,
      phase: this.phase,
      players: Array.from(this.players.values()).map(({ socketId, sessionId, wrongGuessesThisRound, ...p }) => p),
      hostId: this.hostId,
      artistId: this.artistId,
      round: Math.min(this.round, this.totalRounds) || 1,
      totalRounds: this.totalRounds,
      wordLength: this.currentWord ? this.currentWord.replace(/ /g, "").length : null,
      revealedWord: isArtist || solved || revealArtist ? this.currentWord : null,
      wordChoices: isArtist ? this.wordChoices : null,
      phaseEndsAt: this.phaseEndsAt,
      drawStartsAt: this.phase === "DRAWING" ? this.drawStartsAt : null,
      drawSeconds: this.drawSeconds,
      guesses: this.guesses,
      awards: this.awards,
      settings: {
        maxPlayers: this.maxPlayers,
        totalRounds: this.totalRounds,
        drawSeconds: this.drawSeconds,
        gameMode: this.gameMode,
        maxPromptWords: this.maxPromptWords,
      },
      hintPattern: this.phase === "DRAWING" && this.currentWord ? buildHintPattern(this.currentWord, this.hintRevealedIndices) : null,
      turnOutcome: this.phase === "ROUND_REVEAL" || this.phase === "SCOREBOARD" ? this.turnOutcome : null,
      skipVote: open
        ? {
            artistName: (this.artistId && this.players.get(this.artistId)?.name) || "The artist",
            votes: this.skipVotes.size,
            needed: voters.length,
            youVoted: this.skipVotes.has(forPlayerId),
            youCanVote: voters.some((p) => p.id === forPlayerId),
          }
        : null,
      spectators: Array.from(this.spectators.values()).map(({ socketId, sessionId, ...w }) => w),
      viewerRole: this.spectators.has(forPlayerId) ? "spectator" : "player",
    };
  }

  broadcastState() {
    for (const player of this.players.values()) {
      if (player.socketId) {
        this.io.to(player.socketId).emit("room_state", this.getSnapshot(player.id));
      }
    }
    for (const watcher of this.spectators.values()) {
      if (watcher.socketId) this.io.to(watcher.socketId).emit("room_state", this.getSnapshot(watcher.id));
    }
  }

  isEmpty() {
    return this.players.size === 0;
  }
}
