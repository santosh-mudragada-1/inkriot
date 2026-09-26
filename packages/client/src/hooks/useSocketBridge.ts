import { useEffect, useRef } from "react";
import type { DrawOp, GuessMessage, ReactionEvent, RoomSnapshot, ScorePopup } from "@inkriot/shared";
import { socket } from "../lib/socket";
import { useGameStore } from "../store/useGameStore";
import { audio } from "../lib/audio/AudioManager";
import { useProgress } from "../lib/progress";
import { confetti, shake } from "../lib/juice";
import { bufferCanvasHistory } from "../lib/canvasHistoryBuffer";

function revealedLetterCount(pattern: (string | null)[] | null): number {
  if (!pattern) return 0;
  return pattern.filter((c) => c && c !== " ").length;
}

/** Translate server snapshots into progression events (XP, streak days, achievements). */
function trackProgress(prev: RoomSnapshot | null, next: RoomSnapshot, selfId: string | null) {
  if (!selfId) return;
  const progress = useProgress.getState();
  const me = next.players.find((p) => p.id === selfId);
  const prevMe = prev?.players.find((p) => p.id === selfId);

  // A new game started (lobby -> first word pick).
  if (prev && prev.phase === "LOBBY" && next.phase === "WORD_SELECTION") progress.beginGame();

  // I just guessed correctly.
  if (me && prevMe && next.phase === "DRAWING" && me.hasGuessedCorrectly && !prevMe.hasGuessedCorrectly) {
    const correctCount = next.players.filter((p) => p.id !== next.artistId && p.hasGuessedCorrectly).length;
    progress.recordCorrect({ ms: me.lastGuessMs, streak: me.streak, first: correctCount === 1 });
  }

  // My drawing turn just ended.
  if (prev && prev.phase === "DRAWING" && next.phase === "ROUND_REVEAL" && prev.artistId === selfId) {
    const guessers = next.players.filter((p) => p.id !== selfId && p.connected);
    progress.recordDrawTurn({ guessed: guessers.filter((p) => p.hasGuessedCorrectly).length, guessers: guessers.length });
  }

  // Game over.
  if (prev && prev.phase !== "GAME_COMPLETE" && next.phase === "GAME_COMPLETE" && me) {
    const sorted = [...next.players].sort((a, b) => b.score - a.score);
    progress.finishGame({ score: me.score, rank: sorted.findIndex((p) => p.id === selfId) + 1, playerCount: next.players.length });
  }
}

export function useSocketBridge() {
  const prevPlayerCount = useRef<number | null>(null);
  const prevHintCount = useRef<number>(0);

  useEffect(() => {
    const store = useGameStore.getState;

    const onConnect = () => useGameStore.setState({ connected: true });
    const onDisconnect = () => useGameStore.setState({ connected: false });

    const onRoomState = (snapshot: RoomSnapshot) => {
      const prev = store().room;
      if (prevPlayerCount.current !== null && prev?.code === snapshot.code) {
        if (snapshot.players.length > prevPlayerCount.current) audio.playJoin();
        else if (snapshot.players.length < prevPlayerCount.current) audio.playLeave();
      }
      prevPlayerCount.current = snapshot.players.length;

      const hintCount = revealedLetterCount(snapshot.hintPattern);
      if (snapshot.phase === "DRAWING" && hintCount > prevHintCount.current) audio.playHintReveal();
      prevHintCount.current = snapshot.phase === "DRAWING" ? hintCount : 0;

      if (prev && prev.phase !== snapshot.phase) {
        if (snapshot.phase === "ROUND_REVEAL") audio.playStamp();
        if (snapshot.phase === "SCOREBOARD" || snapshot.phase === "WORD_SELECTION") audio.playWhoosh();
      }

      trackProgress(prev?.code === snapshot.code ? prev : null, snapshot, store().selfId);
      store().setRoom(snapshot);
    };

    const onGuessAdded = (message: GuessMessage) => {
      store().addGuess(message);
      const selfId = store().selfId;
      if (message.correct) {
        if (message.playerId === selfId) {
          const me = store().room?.players.find((p) => p.id === selfId);
          const combo = (me?.streak ?? 0) + 1;
          audio.playCorrect(combo);
          shake(combo >= 3 ? 2 : 1);
          const input = Array.from(document.querySelectorAll<HTMLElement>(".guess-input")).find((el) => el.offsetParent !== null);
          confetti.fromElement(input ?? document.querySelector(".canvas-frame"), { count: 50 + Math.min(combo, 6) * 15, power: 13 });
        } else {
          audio.playOtherCorrect();
          if (store().room?.artistId === selfId) confetti.fromElement(document.querySelector(".canvas-frame"), { count: 24, power: 9 });
        }
      } else if (message.systemType) {
        // system messages (join/leave/info) — no sfx here, handled by player-count diff
      } else if (message.playerId === selfId) {
        if (message.close) audio.playClose();
        else audio.playWrong();
      }
    };

    const onScorePopup = (popup: ScorePopup) => {
      store().addScorePopup(popup);
      if (popup.playerId === store().selfId) window.setTimeout(() => audio.playCoin(), 260);
      setTimeout(() => store().removeScorePopup(popup.id), 1600);
    };

    const onReaction = (event: ReactionEvent) => {
      store().addReaction(event);
      audio.playReaction();
      setTimeout(() => store().removeReaction(event.id), 2200);
    };

    // Buffer history so a canvas that mounts after the event (e.g. right after joining)
    // can still replay what's already been drawn.
    const onCanvasHistory = (ops: DrawOp[]) => bufferCanvasHistory(ops);

    const onError = (message: string) => store().setError(message);
    const onKicked = (reason: string) => store().setError(reason);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room_state", onRoomState);
    socket.on("guess_added", onGuessAdded);
    socket.on("score_popup", onScorePopup);
    socket.on("reaction", onReaction);
    socket.on("canvas_history", onCanvasHistory);
    socket.on("error_message", onError);
    socket.on("kicked", onKicked);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room_state", onRoomState);
      socket.off("guess_added", onGuessAdded);
      socket.off("score_popup", onScorePopup);
      socket.off("reaction", onReaction);
      socket.off("canvas_history", onCanvasHistory);
      socket.off("error_message", onError);
      socket.off("kicked", onKicked);
    };
  }, []);
}
