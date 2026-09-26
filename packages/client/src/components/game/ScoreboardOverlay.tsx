import { motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { useCountdown } from "../../hooks/useCountdown";
import "./ScoreboardOverlay.css";

export function ScoreboardOverlay() {
  const room = useGameStore((s) => s.room)!;
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(1, sorted[0]?.score ?? 1);
  const remainingMs = useCountdown(room.phaseEndsAt);

  return (
    <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="scoreboard-card"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <h2 className="scoreboard-title">Standings</h2>
        <div className="scoreboard-rows">
          {sorted.map((p, i) => (
            <motion.div key={p.id} layout className="sb-row">
              <span className="sb-rank">{i + 1}</span>
              <span className="sb-avatar" style={{ background: p.color }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="sb-name">{p.name}</span>
              <div className="sb-bar-track">
                <motion.div
                  className="sb-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${(p.score / maxScore) * 100}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="sb-score">{p.score}</span>
            </motion.div>
          ))}
        </div>
        <p className="scoreboard-next">Next round in {Math.ceil(remainingMs / 1000)}s</p>
      </motion.div>
    </motion.div>
  );
}
