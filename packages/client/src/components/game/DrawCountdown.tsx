import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { audio } from "../../lib/audio/AudioManager";
import "./DrawCountdown.css";

const STEPS = ["3", "2", "1", "GO!"];

export function DrawCountdown() {
  const phase = useGameStore((s) => s.room?.phase);
  const prevPhase = useRef(phase);
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  useEffect(() => {
    if (phase === "DRAWING" && prevPhase.current !== "DRAWING") {
      let i = 0;
      setStepIndex(0);
      audio.playCountdownTick(false);
      const id = setInterval(() => {
        i++;
        if (i >= STEPS.length) {
          clearInterval(id);
          setTimeout(() => setStepIndex(null), 500);
          audio.playGo();
          return;
        }
        setStepIndex(i);
        audio.playCountdownTick(i >= 2);
      }, 320);
    }
    prevPhase.current = phase;
  }, [phase]);

  return (
    <AnimatePresence>
      {stepIndex !== null && (
        <div className="draw-countdown">
          <AnimatePresence mode="wait">
            <motion.span
              key={stepIndex}
              className={`draw-countdown-step ${STEPS[stepIndex] === "GO!" ? "is-go" : ""}`}
              initial={{ scale: 0.2, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: stepIndex % 2 ? 6 : -6 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {STEPS[stepIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
