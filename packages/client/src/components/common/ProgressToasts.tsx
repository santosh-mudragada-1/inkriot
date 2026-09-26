import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "../../lib/progress";
import { audio } from "../../lib/audio/AudioManager";
import { confetti } from "../../lib/juice";
import "./ProgressToasts.css";

const SHOW_MS = 3200;

/** Shows achievement unlocks and level-ups one at a time, with a jingle and a small burst. */
export function ProgressToasts() {
  const event = useProgress((s) => s.events[0]);
  const consume = useProgress((s) => s.consumeEvent);

  useEffect(() => {
    if (!event) return;
    if (event.kind === "level") {
      audio.playLevelUp();
      confetti.burst({ x: window.innerWidth / 2, y: 90, count: 90, power: 13, spread: Math.PI * 1.6 });
    } else {
      audio.playAchievement();
      confetti.burst({ x: window.innerWidth / 2, y: 90, count: 36, power: 9 });
    }
    const t = window.setTimeout(consume, SHOW_MS);
    return () => window.clearTimeout(t);
  }, [event, consume]);

  return (
    <div className="progress-toasts" aria-live="polite">
      <AnimatePresence mode="wait">
        {event && (
          <motion.div
            key={event.kind === "level" ? `lvl-${event.level}` : event.achievement.id}
            className={`progress-toast is-${event.kind}`}
            initial={{ y: -90, rotate: -8, scale: 0.7 }}
            animate={{ y: 0, rotate: -2, scale: 1 }}
            exit={{ y: -90, opacity: 0, rotate: 4 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
            onClick={consume}
          >
            <span className="progress-toast-emoji">{event.kind === "level" ? "⬆️" : event.achievement.emoji}</span>
            <span className="progress-toast-text">
              <span className="progress-toast-kicker">{event.kind === "level" ? "Level up!" : "Achievement unlocked"}</span>
              <strong>{event.kind === "level" ? `Level ${event.level} · ${event.title}` : event.achievement.title}</strong>
              {event.kind === "achievement" && <span className="progress-toast-desc">{event.achievement.desc}</span>}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
