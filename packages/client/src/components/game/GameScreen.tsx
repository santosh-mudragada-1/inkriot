import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { RoundHeader } from "./RoundHeader";
import { Canvas, type CanvasHandle } from "../drawing/Canvas";
import { Toolbar } from "../drawing/Toolbar";
import { Leaderboard } from "../leaderboard/Leaderboard";
import { GuessFeed } from "../chat/GuessFeed";
import { GuessInput } from "../chat/GuessInput";
import { ReactionBar } from "../chat/ReactionBar";
import { FloatingReactions } from "../chat/FloatingReactions";
import { DrawCountdown } from "./DrawCountdown";
import { WordSelectOverlay } from "./WordSelectOverlay";
import { RoundRevealOverlay } from "./RoundRevealOverlay";
import { ScoreboardOverlay } from "./ScoreboardOverlay";
import "./GameScreen.css";

export default function GameScreen() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const canvasRef = useRef<CanvasHandle>(null);
  const [sheet, setSheet] = useState<"none" | "players" | "chat">("none");

  const isArtist = selfId === room.artistId;
  const self = room.players.find((p) => p.id === selfId);
  const canvasActive = room.phase === "DRAWING";

  const guessPlaceholder = isArtist
    ? "You're drawing — guessing is off"
    : self?.hasGuessedCorrectly
      ? "You got it! Waiting on the others…"
      : "Type your guess...";

  return (
    <div className="game-screen">
      <RoundHeader />

      <div className="game-body">
        <aside className="game-panel panel-left">
          <Leaderboard />
        </aside>

        <div className="game-center">
          <div className="canvas-wrap">
            <Canvas ref={canvasRef} isArtist={isArtist} active={canvasActive} />
            <FloatingReactions />
            <DrawCountdown />
            <AnimatePresence>
              {room.phase === "WORD_SELECTION" && <WordSelectOverlay key="word-select" />}
              {room.phase === "ROUND_REVEAL" && <RoundRevealOverlay key="reveal" />}
              {room.phase === "SCOREBOARD" && <ScoreboardOverlay key="scoreboard" />}
            </AnimatePresence>
          </div>
          {isArtist && canvasActive && (
            <div className="toolbar-dock">
              <Toolbar onUndo={() => canvasRef.current?.undo()} onClear={() => canvasRef.current?.clear()} />
            </div>
          )}
        </div>

        <aside className="game-panel panel-right">
          <GuessFeed />
          <ReactionBar />
          <GuessInput disabled={isArtist || !!self?.hasGuessedCorrectly} placeholder={guessPlaceholder} />
        </aside>
      </div>

      <div className="mobile-tabs">
        <button className={sheet === "players" ? "active" : ""} onClick={() => setSheet(sheet === "players" ? "none" : "players")}>
          Players ({room.players.length})
        </button>
        <button className={sheet === "chat" ? "active" : ""} onClick={() => setSheet(sheet === "chat" ? "none" : "chat")}>
          Chat
        </button>
      </div>

      <AnimatePresence>
        {sheet !== "none" && (
          <div className="mobile-sheet" onClick={() => setSheet("none")}>
            <div className="mobile-sheet-content" onClick={(e) => e.stopPropagation()}>
              {sheet === "players" ? (
                <Leaderboard />
              ) : (
                <div className="mobile-chat">
                  <GuessFeed />
                  <ReactionBar />
                  <GuessInput disabled={isArtist || !!self?.hasGuessedCorrectly} placeholder={guessPlaceholder} />
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
