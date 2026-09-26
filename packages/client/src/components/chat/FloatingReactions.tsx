import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import "./FloatingReactions.css";

export function FloatingReactions() {
  const reactions = useGameStore((s) => s.reactions);
  const positioned = useMemo(
    () => reactions.map((r) => ({ ...r, left: 10 + Math.random() * 80, rotate: -18 + Math.random() * 36 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reactions.map((r) => r.id).join(",")],
  );

  return (
    <div className="floating-reactions">
      <AnimatePresence>
        {positioned.map((r) => (
          <motion.span
            key={r.id}
            className="floating-reaction"
            style={{ left: `${r.left}%` }}
            initial={{ opacity: 0, y: 20, scale: 0.4, rotate: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: -180, scale: [0.4, 1.4, 1.1, 1], rotate: r.rotate }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
          >
            {r.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
