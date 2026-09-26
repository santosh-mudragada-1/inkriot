import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { audio } from "../../lib/audio/AudioManager";
import { RoundHeader } from "./RoundHeader";
import { Canvas, type CanvasHandle } from "../drawing/Canvas";
import { Toolbar } from "../drawing/Toolbar";
import { Leaderboard } from "../leaderboard/Leaderboard";
import { GuessFeed } from "../chat/GuessFeed";
import { GuessInput } from "../chat/GuessInput";
import { ReactionBar } from "../chat/ReactionBar";
import { FloatingReactions } from "../chat/FloatingReactions";
import { DrawCountdown } from "./DrawCountdown";
import { ComboStamp } from "./ComboStamp";
import { WordSelectOverlay } from "./WordSelectOverlay";
import { RoundRevealOverlay } from "./RoundRevealOverlay";
import { ScoreboardOverlay } from "./ScoreboardOverlay";
import "./GameScreen.css";

export default function GameScreen() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const unread = useGameStore((s) => s.guesses.length);
  const canvasRef = useRef<CanvasHandle>(null);
  const [sheet, setSheet] = useState<"none" | "players" | "chat">("none");
  const [seenCount, setSeenCount] = useState(0);

  const isArtist = selfId === room.artistId;
  const self = room.players.find((p) => p.id === selfId);
  const canvasActive = room.phase === "DRAWING";

  useEffect(() => {
    audio.setMusicMood("game");
  }, []);
  useEffect(() => {
    // Music sits back while people concentrate on drawing/guessing.
    audio.setMusicDuck(room.phase === "DRAWING" ? 0.55 : 1);
  }, [room.phase]);

  const guessPlaceholder = isArtist
    ? "You're drawing — no peeking in chat 😉"
    : self?.hasGuessedCorrectly
      ? "You got it! 🎉"
      : room.phase === "DRAWING"
        ? "Type your guess…"
        : "Guessing opens when drawing starts";
  const openSheet = (next: "players" | "chat") => {
    const target = sheet === next ? "none" : next;
    // Opening or closing chat marks everything so far as read.
    if (next === "chat" || sheet === "chat") setSeenCount(unread);
    setSheet(target);
  };
  const inputDisabled = isArtist || !!self?.hasGuessedCorrectly || room.phase !== "DRAWING";

  return (
    <div className={`game-screen ${isArtist ? "is-artist" : ""}`}>
      <RoundHeader />

      <div className="game-body">
        <aside className="game-panel panel-left">
          <Leaderboard />
        </aside>

        <div className="game-center">
          <div className="canvas-wrap">
            <Canvas ref={canvasRef} isArtist={isArtist} active={canvasActive} />
            <FloatingReactions />
            <ComboStamp />
            <DrawCountdown />
            <AnimatePresence>
              {room.phase === "WORD_SELECTION" && <WordSelectOverlay key="word-select" />}
              {room.phase === "ROUND_REVEAL" && <RoundRevealOverlay key="reveal" />}
              {room.phase === "SCOREBOARD" && <ScoreboardOverlay key="scoreboard" />}
            </AnimatePresence>
          </div>
          {isArtist && canvasActive ? (
            <div className="toolbar-dock">
              <Toolbar onUndo={() => canvasRef.current?.undo()} onClear={() => canvasRef.current?.clear()} />
            </div>
          ) : (
            <div className="mobile-guess">
              <GuessInput disabled={inputDisabled} placeholder={guessPlaceholder} />
            </div>
          )}
        </div>

        <aside className="game-panel panel-right">
          <div className="chat-head">
            <h3>Guesses</h3>
            <span className="hand">{room.phase === "DRAWING" ? "type fast!" : "chat"}</span>
          </div>
          <GuessFeed />
          <ReactionBar />
          <GuessInput disabled={inputDisabled} placeholder={guessPlaceholder} />
        </aside>
      </div>

      <nav className="mobile-tabs">
        <button className={sheet === "players" ? "active" : ""} onClick={() => openSheet("players")}>
          🏆 Scores
        </button>
        <button className={sheet === "chat" ? "active" : ""} onClick={() => openSheet("chat")}>
          💬 Chat
          {sheet !== "chat" && unread > seenCount && <span className="mobile-badge">{Math.min(99, unread - seenCount)}</span>}
        </button>
      </nav>

      <AnimatePresence>
        {sheet !== "none" && (
          <motion.div
            className="mobile-sheet"
            onClick={() => {
              if (sheet === "chat") setSeenCount(unread);
              setSheet("none");
            }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="mobile-sheet-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 36 }}
            >
              {sheet === "players" ? (
                <Leaderboard />
              ) : (
                <div className="mobile-chat">
                  <GuessFeed />
                  <ReactionBar />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
