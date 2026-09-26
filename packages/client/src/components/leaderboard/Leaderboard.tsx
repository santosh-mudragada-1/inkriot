import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import "./Leaderboard.css";

export function Leaderboard() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const scorePopups = useGameStore((s) => s.scorePopups);
  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">Leaderboard</h3>
      <div className="leaderboard-list">
        {sorted.map((p, i) => (
          <motion.div key={p.id} layout className={`lb-row ${p.id === selfId ? "is-self" : ""}`} transition={{ type: "spring", stiffness: 400, damping: 32 }}>
            <span className="lb-rank">{i + 1}</span>
            <span className="lb-avatar" style={{ background: p.color, opacity: p.connected ? 1 : 0.4 }}>
              {p.name.charAt(0).toUpperCase()}
            </span>
            <span className="lb-name">
              {p.name}
              {p.id === room.artistId && <span title="Drawing"> ✏️</span>}
              {p.streak >= 2 && <span title="On a streak"> 🔥{p.streak}</span>}
            </span>
            <span className="lb-score">{p.score}</span>
            <AnimatePresence>
              {scorePopups
                .filter((s) => s.playerId === p.id)
                .map((s) => (
                  <motion.span
                    key={s.id}
                    className="lb-popup"
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -34 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  >
                    +{s.amount}
                  </motion.span>
                ))}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
