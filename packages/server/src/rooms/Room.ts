import { Server } from "socket.io";
import { nanoid } from "nanoid";
import {
  AVATAR_COLORS,
  AVATAR_PATTERN,
  ClientToServerEvents,
  DEFAULT_DRAW_SECONDS,
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
  MAX_CHAT_HISTORY,
  MAX_GUESS_LENGTH,
  MAX_NICKNAME_LENGTH,
  MAX_PLAYERS_PER_ROOM,
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
  WORD_CHOICE_COUNT,
  PROMPT_LENGTH_OPTIONS,
  WORD_SELECTION_SECONDS,
  artistPoints,
  buildHintPattern,
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
  canvasOps: DrawOp[] = [];
  guesses: GuessMessage[] = [];
  phaseEndsAt: number | null = null;
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

  addPlayer(nickname: string, socketId: string, avatar?: string): { playerId: string; sessionId: string } | { error: string } {
    this.touch();
    if (this.players.size >= this.maxPlayers) return { error: "Room is full." };
    if (this.phase !== "LOBBY") return { error: "Game already in progress." };

    const cleanName = nickname.trim().slice(0, MAX_NICKNAME_LENGTH) || "Player";
    const existingNames = new Set(Array.from(this.players.values()).map((p) => p.name.toLowerCase()));
    let finalName = cleanName;
    let suffix = 2;
    while (existingNames.has(finalName.toLowerCase())) {
      finalName = `${cleanName} (${suffix++})`;
    }

    const playerId = nanoid(10);
    const sessionId = nanoid(21);
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
    if (!player) return { error: "Session not found." };
    player.connected = true;
    player.socketId = socketId;
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }
    this.touch();
    return { playerId };
  }

  markDisconnected(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.connected = false;
    player.socketId = null;
    this.broadcastState();

    const timer = setTimeout(() => this.removePlayer(playerId), RECONNECT_GRACE_MS);
    this.disconnectTimers.set(playerId, timer);
  }

  removePlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;
    this.disconnectTimers.get(playerId) && clearTimeout(this.disconnectTimers.get(playerId)!);
    this.disconnectTimers.delete(playerId);
    this.players.delete(playerId);
    this.sessionToPlayer.delete(player.sessionId);
    this.artistOrder = this.artistOrder.filter((id) => id !== playerId);

    if (this.players.size === 0) {
      this.clearPhaseTimer();
      this.onEmpty();
      return;
    }

    if (this.hostId === playerId) {
      const next = Array.from(this.players.values()).find((p) => p.connected) ?? Array.from(this.players.values())[0];
      this.hostId = next.id;
      next.isHost = true;
    }

    if (this.artistId === playerId && (this.phase === "DRAWING" || this.phase === "WORD_SELECTION")) {
      this.addSystemMessage(`${player.name} left mid-turn — skipping to next round.`);
      this.endRound();
    } else {
      this.broadcastState();
    }
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
    this.wordChoices = pickRandomWords(WORD_CHOICE_COUNT, this.usedWords, this.gameMode, this.maxPromptWords);
    this.canvasOps = [];
    this.guesses = [];
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
    this.wordChoices = null;
    this.clearPhaseTimer();
    this.setPhase("DRAWING", this.drawSeconds * 1000, () => this.endRound());
    this.scheduleHints();
  }

  private scheduleHints() {
    this.clearHintTimers();
    this.hintRevealedIndices.clear();
    if (!this.currentWord) return;
    const indices = letterIndices(this.currentWord);
    if (indices.length < 3) return; // too short to bother hinting

    const drawMs = this.drawSeconds * 1000;
    const reveal = (fraction: number) => {
      const target = hintTargetCount(indices.length, fraction);
      const hidden = indices.filter((i) => !this.hintRevealedIndices.has(i));
      shuffleInPlace(hidden);
      const need = target - this.hintRevealedIndices.size;
      for (let k = 0; k < need && k < hidden.length; k++) this.hintRevealedIndices.add(hidden[k]);
      this.broadcastState();
    };

    this.hintTimers.push(setTimeout(() => reveal(0.3), drawMs * 0.3));
    this.hintTimers.push(setTimeout(() => reveal(0.6), drawMs * 0.6));
  }

  private clearHintTimers() {
    for (const t of this.hintTimers) clearTimeout(t);
    this.hintTimers = [];
  }

  handleDrawOp(playerId: string, op: DrawOp) {
    if (this.phase === "LOBBY") return this.handleLobbyWallOp(playerId, op);
    if (playerId !== this.artistId || this.phase !== "DRAWING") return;
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
      const remainingMs = Math.max(0, (this.phaseEndsAt ?? Date.now()) - Date.now());
      const points = guesserPoints(remainingMs, this.drawSeconds * 1000, player.streak);
      player.score += points;
      player.lastGuessMs = this.drawSeconds * 1000 - remainingMs;

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
      player.streak = 0;
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

  private endRound() {
    if (this.phase === "ROUND_REVEAL" || this.phase === "SCOREBOARD") return;
    this.clearHintTimers();
    const artist = this.artistId ? this.players.get(this.artistId) : null;
    const stats = this.turnStats[this.turnStats.length - 1];
    if (artist && stats) {
      const points = artistPoints(stats.correctGuesserCount);
      artist.score += points;
      if (points > 0) {
        this.io.to(this.code).emit("score_popup", { id: nanoid(6), playerId: artist.id, amount: points, createdAt: Date.now() });
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
    this.clearPhaseTimer();
    this.clearHintTimers();
    this.phase = "LOBBY";
    this.round = 0;
    this.turnIndex = -1;
    this.artistId = null;
    this.currentWord = null;
    this.wordChoices = null;
    this.canvasOps = [];
    this.guesses = [];
    this.awards = null;
    this.phaseEndsAt = null;
    this.scoreAtRoundOneEnd.clear();
    for (const p of this.players.values()) {
      p.score = 0;
      p.streak = 0;
      p.hasGuessedCorrectly = false;
    }
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
    const isArtist = forPlayerId === this.artistId;
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
      revealedWord: isArtist || revealArtist ? this.currentWord : null,
      wordChoices: isArtist ? this.wordChoices : null,
      phaseEndsAt: this.phaseEndsAt,
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
    };
  }

  broadcastState() {
    for (const player of this.players.values()) {
      if (player.socketId) {
        this.io.to(player.socketId).emit("room_state", this.getSnapshot(player.id));
      }
    }
  }

  isEmpty() {
    return this.players.size === 0;
  }
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
