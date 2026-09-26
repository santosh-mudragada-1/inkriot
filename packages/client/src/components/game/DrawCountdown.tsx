import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DRAW_COUNTDOWN_MS } from "@inkriot/shared";
import { useGameStore } from "../../store/useGameStore";
import { audio } from "../../lib/audio/AudioManager";
import "./DrawCountdown.css";

const STEPS = ["3", "2", "1", "GO!"];
/** Each number holds for this long; "GO!" takes whatever is left of the countdown and lingers a beat. */
const STEP_MS = 800;
const GO_LINGER_MS = 700;
const STEP_COLORS = ["var(--color-sky)", "var(--color-sun)", "var(--color-gum)", "var(--color-tomato)"];

/**
 * The "3, 2, 1, GO!" before each drawing turn. It's driven by the server's
 * `drawStartsAt` so every player sees the same beat, and the draw clock only starts
 * once it's over — so the countdown can take its time without costing anyone.
 */
export function DrawCountdown() {
  const phase = useGameStore((s) => s.room?.phase);
  const drawStartsAt = useGameStore((s) => s.room?.drawStartsAt ?? null);
  const artistName = useGameStore((s) => s.room?.players.find((p) => p.id === s.room?.artistId)?.name);
  const isArtist = useGameStore((s) => s.selfId !== null && s.selfId === s.room?.artistId);
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== "DRAWING" || !drawStartsAt) {
      setStepIndex(null);
      return;
    }
    const countdownStart = drawStartsAt - DRAW_COUNTDOWN_MS;
    const timers: number[] = [];
    let lastPlayed = -1;
    const show = (i: number) => {
      setStepIndex(i);
      if (i === lastPlayed) return;
      lastPlayed = i;
      if (i === STEPS.length - 1) audio.playGo();
      else audio.playCountdownTick(i >= 2);
    };
    const now = Date.now();
    if (now > drawStartsAt + GO_LINGER_MS) return; // joined mid-turn — nothing to count
    STEPS.forEach((_, i) => {
      const at = countdownStart + i * STEP_MS;
      const nextAt = i === STEPS.length - 1 ? drawStartsAt + GO_LINGER_MS : countdownStart + (i + 1) * STEP_MS;
      if (nextAt <= now) return;
      timers.push(window.setTimeout(() => show(i), Math.max(0, at - now)));
    });
    timers.push(window.setTimeout(() => setStepIndex(null), drawStartsAt + GO_LINGER_MS - now));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, drawStartsAt]);

  const isGo = stepIndex === STEPS.length - 1;

  return (
    <AnimatePresence>
      {stepIndex !== null && (
        <motion.div
          className="draw-countdown"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
        >
          <span className="draw-countdown-caption hand">
            {isArtist ? "get your pen ready…" : `${artistName ?? "the artist"} is about to draw…`}
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={stepIndex}
              className={`draw-countdown-step ${isGo ? "is-go" : ""}`}
              style={{ color: STEP_COLORS[stepIndex] }}
              initial={{ scale: 0.1, opacity: 0, rotate: -40, y: 40 }}
              animate={{ scale: 1, opacity: 1, rotate: stepIndex % 2 ? 6 : -6, y: 0 }}
              exit={{ scale: 1.8, opacity: 0, rotate: stepIndex % 2 ? 20 : -20, transition: { duration: 0.28 } }}
              transition={{ type: "spring", stiffness: 260, damping: 14, mass: 0.9 }}
            >
              {STEPS[stepIndex]}
            </motion.span>
          </AnimatePresence>
          <motion.span
            key={`ring-${stepIndex}`}
            className="draw-countdown-ring"
            initial={{ scale: 0.4, opacity: 0.7 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            style={{ borderColor: STEP_COLORS[stepIndex] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
