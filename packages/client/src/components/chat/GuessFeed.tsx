import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import "./GuessFeed.css";

export function GuessFeed() {
  const guesses = useGameStore((s) => s.guesses);
  const selfId = useGameStore((s) => s.selfId);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [guesses.length]);

  return (
    <div className="guess-feed" role="log" aria-live="polite">
      {guesses.length === 0 && <p className="guess-empty hand">guesses show up here — wrong ones too 😅</p>}
      <AnimatePresence initial={false}>
        {guesses.map((g) => {
          const mine = g.playerId === selfId;
          if (g.systemType === "info") {
            return (
              <motion.div key={g.id} className="guess-line is-system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                {g.text}
              </motion.div>
            );
          }
          if (g.correct) {
            return (
              <motion.div
                key={g.id}
                className="guess-line is-correct"
                style={{ ["--pc" as string]: g.playerColor }}
                initial={{ opacity: 0, scale: 1.4, rotate: -4 }}
                animate={{ opacity: 1, scale: 1, rotate: -1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                layout
              >
                <span className="correct-check">✓</span>
                <span>
                  <b>{mine ? "You" : g.playerName}</b> got it!
                </span>
              </motion.div>
            );
          }
          return (
            <motion.div
              key={g.id}
              className={`guess-line ${mine ? "is-mine" : ""} ${g.close ? "is-close" : ""}`}
              style={{ ["--pc" as string]: g.playerColor }}
              initial={{ opacity: 0, x: mine ? 16 : -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              layout
            >
              <b className="guess-name">{g.playerName}</b>
              <span className="guess-text">{g.text}</span>
              {g.close && <em className="close-hint">so close!</em>}
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}
