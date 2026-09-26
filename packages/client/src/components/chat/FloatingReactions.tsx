import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { reactionMotion } from "./reactionMotion";
import "./FloatingReactions.css";

/** Same emoji this many times within HYPE_WINDOW_MS (from anyone) triggers a hype counter. */
const HYPE_THRESHOLD = 3;
const HYPE_WINDOW_MS = 2500;
const BURST_COUNT = 6;

/** Stable pseudo-random spot/size/direction from the reaction id, so re-renders never move it. */
function placement(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const rand = (shift: number) => ((h >>> shift) & 0xff) / 255;
  return { left: 8 + rand(0) * 84, dir: rand(8) < 0.5 ? -1 : 1, size: 40 + rand(16) * 16 };
}

interface Hype {
  emoji: string;
  count: number;
  key: string;
}

export function FloatingReactions() {
  const reactions = useGameStore((s) => s.reactions);
  const players = useGameStore((s) => s.room?.players);
  const history = useRef<{ emoji: string; at: number }[]>([]);
  const [hype, setHype] = useState<Hype | null>(null);

  const positioned = useMemo(
    () =>
      reactions.map((r) => {
        const player = players?.find((p) => p.id === r.playerId);
        return { ...r, ...placement(r.id), name: player?.name ?? "", color: player?.color ?? "var(--color-ink)" };
      }),
    [reactions, players],
  );

  // Track spam of the same emoji to show a "×N" hype counter.
  const latest = reactions[reactions.length - 1];
  useEffect(() => {
    if (!latest) return;
    const now = Date.now();
    history.current = [...history.current.filter((h) => now - h.at < HYPE_WINDOW_MS), { emoji: latest.emoji, at: now }];
    const count = history.current.filter((h) => h.emoji === latest.emoji).length;
    if (count >= HYPE_THRESHOLD) setHype({ emoji: latest.emoji, count, key: latest.id });
    const t = window.setTimeout(() => setHype((h) => (h?.key === latest.id ? null : h)), HYPE_WINDOW_MS);
    return () => window.clearTimeout(t);
    // only re-run for a new reaction
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id]);

  return (
    <div className="floating-reactions" aria-hidden>
      {positioned.map((r) => (
          <div key={r.id} className="floating-reaction-anchor" style={{ left: `${r.left}%` }}>
            {/* little confetti burst of mini copies where it spawns */}
            {Array.from({ length: BURST_COUNT }).map((_, i) => {
              const angle = (i / BURST_COUNT) * Math.PI * 2 + r.dir;
              return (
                <motion.span
                  key={i}
                  className="reaction-mini"
                  initial={{ x: 0, y: 0, scale: 0.2, opacity: 1 }}
                  animate={{ x: Math.cos(angle) * 60, y: Math.sin(angle) * 44 - 10, scale: 0.55, opacity: 0, rotate: 90 * r.dir }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {r.emoji}
                </motion.span>
              );
            })}
            <motion.span className="floating-reaction" style={{ fontSize: r.size }} initial={{ opacity: 0, scale: 0.3 }} animate={reactionMotion(r.emoji, r.dir)}>
              {r.emoji}
              {r.name && (
                <span className="floating-reaction-name" style={{ background: r.color }}>
                  {r.name}
                </span>
              )}
            </motion.span>
          </div>
        ))}

      <AnimatePresence>
        {hype && (
          <motion.div
            key={hype.emoji}
            className="reaction-hype"
            initial={{ scale: 0, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.3 } }}
            transition={{ type: "spring", stiffness: 380, damping: 12 }}
          >
            <span className="reaction-hype-emoji">{hype.emoji}</span>
            <motion.span key={hype.count} className="reaction-hype-count" initial={{ scale: 1.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 12 }}>
              ×{hype.count}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
