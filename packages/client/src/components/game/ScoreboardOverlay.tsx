import { motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { useCountdown } from "../../hooks/useCountdown";
import { useCountUp } from "../../hooks/useCountUp";
import { DoodleAvatar } from "../common/DoodleAvatar";
import "./ScoreboardOverlay.css";

const BAR_COLORS = ["var(--color-sun)", "var(--color-sky)", "var(--color-gum)", "var(--color-mint)", "var(--color-grape)", "var(--color-tomato)"];

function Points({ value }: { value: number }) {
  return <span className="sb-score">{useCountUp(value, 900)}</span>;
}

export function ScoreboardOverlay() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(1, sorted[0]?.score ?? 1);
  const remainingMs = useCountdown(room.phaseEndsAt);

  return (
    <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="scoreboard-card"
        initial={{ y: 40, opacity: 0, rotate: 2 }}
        animate={{ y: 0, opacity: 1, rotate: -0.5 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <h2 className="scoreboard-title">Standings</h2>
        <div className="scoreboard-rows">
          {sorted.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              className={`sb-row ${p.id === selfId ? "is-self" : ""}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <span className="sb-rank">{i + 1}</span>
              <span className="avatar-disc sb-avatar">
                <DoodleAvatar avatar={p.avatar} seed={p.id} size={34} crop="bust" />
              </span>
              <span className="sb-name">{p.name}</span>
              <div className="sb-bar-track">
                <motion.div
                  className="sb-bar-fill"
                  style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(3, (p.score / maxScore) * 100)}%` }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <Points value={p.score} />
            </motion.div>
          ))}
        </div>
        <p className="scoreboard-next hand">
          next turn in {Math.ceil(remainingMs / 1000)}s…
        </p>
      </motion.div>
    </motion.div>
  );
}
