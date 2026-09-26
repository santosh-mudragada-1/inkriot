import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import "./GuessFeed.css";

export function GuessFeed() {
  const guesses = useGameStore((s) => s.guesses);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [guesses.length]);

  return (
    <div className="guess-feed">
      <AnimatePresence initial={false}>
        {guesses.map((g) => (
          <motion.div
            key={g.id}
            className={`guess-line ${g.correct ? "is-correct" : ""} ${g.close ? "is-close" : ""} ${g.systemType === "info" ? "is-system" : ""}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            layout
          >
            {g.correct ? (
              <span>
                <b style={{ color: g.playerColor }}>✓ {g.playerName}</b> guessed correctly!
              </span>
            ) : g.systemType === "info" ? (
              <span>{g.text}</span>
            ) : (
              <span>
                <b style={{ color: g.playerColor }}>{g.playerName}</b> {g.text}
                {g.close && <em className="close-hint"> · close!</em>}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}
