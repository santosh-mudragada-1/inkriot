import { useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { REACTIONS } from "@inkriot/shared";
import { socket } from "../../lib/socket";
import { useGameStore } from "../../store/useGameStore";
import "./ReactionBar.css";

const COOLDOWN_MS = 350;

interface Puff {
  id: number;
  emoji: string;
  x: number;
}

function ReactionButton({ emoji, onFire }: { emoji: string; onFire: (emoji: string, el: HTMLElement) => boolean }) {
  const controls = useAnimationControls();
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <motion.button
      ref={ref}
      type="button"
      className="reaction-btn"
      aria-label={`React ${emoji}`}
      animate={controls}
      whileHover={{ y: -5, scale: 1.25, rotate: [0, -12, 12, 0], transition: { rotate: { duration: 0.4 } } }}
      whileTap={{ scale: 0.7 }}
      onClick={() => {
        if (!ref.current) return;
        const sent = onFire(emoji, ref.current);
        void controls.start(
          sent
            ? { scale: [0.7, 1.45, 1], rotate: [0, -20, 14, 0], transition: { duration: 0.45 } }
            : { x: [0, -3, 3, 0], transition: { duration: 0.2 } },
        );
      }}
    >
      {emoji}
    </motion.button>
  );
}

export function ReactionBar() {
  const lastSent = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const [puffs, setPuffs] = useState<Puff[]>([]);
  const phase = useGameStore((s) => s.room?.phase);

  const fire = (emoji: string, el: HTMLElement) => {
    const now = Date.now();
    if (now - lastSent.current < COOLDOWN_MS) return false;
    lastSent.current = now;
    socket.emit("send_reaction", emoji);
    // Instant local feedback: a copy pops out of the button you pressed.
    const bar = barRef.current?.getBoundingClientRect();
    const btn = el.getBoundingClientRect();
    const id = now;
    setPuffs((p) => [...p, { id, emoji, x: bar ? btn.left - bar.left + btn.width / 2 : 0 }]);
    window.setTimeout(() => setPuffs((p) => p.filter((f) => f.id !== id)), 900);
    return true;
  };

  return (
    <div className="reaction-bar-wrap" ref={barRef}>
      {phase === "DRAWING" && <span className="reaction-hint hand">react!</span>}
      <div className="reaction-bar" aria-label="Send a reaction">
        {REACTIONS.map((emoji) => (
          <ReactionButton key={emoji} emoji={emoji} onFire={fire} />
        ))}
      </div>
      <AnimatePresence>
        {puffs.map((p) => (
          <motion.span
            key={p.id}
            className="reaction-puff"
            style={{ left: p.x }}
            initial={{ y: 0, scale: 0.6, opacity: 1 }}
            animate={{ y: -70, scale: 1.8, opacity: 0, rotate: [0, -15, 15, 0] }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
