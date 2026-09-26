import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./HeroScene.css";

const DOODLES = [
  "M20 70 C 20 30, 60 20, 90 35 C 115 47, 120 75, 95 85 C 75 93, 55 80, 60 62 C 63 50, 80 48, 82 60",
  "M15 55 C 25 20, 70 15, 95 40 C 110 55, 100 80, 75 82 L 75 95 M 60 82 L 60 95 M 40 45 L 40 50 M 65 45 L 65 50",
  "M60 15 C 30 25, 20 55, 35 80 C 45 95, 75 95, 85 80 C 100 55, 90 25, 60 15 Z M 60 15 L 60 5 M 45 25 L 35 12 M 75 25 L 85 12",
];

const PLAYERS = ["PRIYA", "ALEX", "JUNO", "SAM"];

const SCRIPT: { guess: string; correct?: boolean; name: string }[] = [
  { guess: "is it a rocket??", name: "ALEX" },
  { guess: "banana???", name: "JUNO" },
  { guess: "guessed the word!", correct: true, name: "PRIYA" },
  { guess: "waffle iron", name: "SAM" },
  { guess: "a cursed toaster", name: "ALEX" },
  { guess: "guessed the word!", correct: true, name: "JUNO" },
];

export function HeroScene() {
  const [doodleIndex, setDoodleIndex] = useState(0);
  const [timer, setTimer] = useState(9);
  const [feedIndex, setFeedIndex] = useState(0);
  const [reaction, setReaction] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTimer((s) => (s <= 0 ? 9 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setDoodleIndex((i) => (i + 1) % DOODLES.length), 4200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setFeedIndex((i) => {
        const next = (i + 1) % SCRIPT.length;
        if (SCRIPT[next].correct) {
          const emojis = ["🔥", "😂", "👏"];
          setReaction(emojis[Math.floor(Math.random() * emojis.length)]);
          setTimeout(() => setReaction(null), 1300);
        }
        return next;
      });
    }, 1650);
    return () => clearInterval(t);
  }, []);

  const visibleFeed = [SCRIPT[feedIndex], SCRIPT[(feedIndex + SCRIPT.length - 1) % SCRIPT.length]];

  return (
    <div className="hero-scene">
      <div className="hero-scene-top">
        <div className="hero-scene-players">
          {PLAYERS.map((name, i) => (
            <motion.span
              key={name}
              className="hero-chip"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            >
              {name}
            </motion.span>
          ))}
        </div>
        <motion.div
          className="hero-timer"
          key={timer}
          initial={{ scale: timer <= 3 ? 1.3 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          data-urgent={timer <= 3}
        >
          {timer}
        </motion.div>
      </div>

      <div className="hero-canvas-frame">
        <svg viewBox="0 0 120 100" className="hero-svg">
          <AnimatePresence mode="wait">
            <motion.path
              key={doodleIndex}
              d={DOODLES[doodleIndex]}
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          </AnimatePresence>
        </svg>
        <AnimatePresence>
          {reaction && (
            <motion.span
              className="hero-reaction"
              initial={{ opacity: 0, y: 10, scale: 0.6 }}
              animate={{ opacity: 1, y: -30, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              {reaction}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="hero-feed">
        <AnimatePresence initial={false} mode="popLayout">
          {visibleFeed.map((item, i) => (
            <motion.div
              key={`${feedIndex}-${i}`}
              className={`hero-feed-line ${item.correct ? "is-correct" : ""}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1 - i * 0.45, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {item.correct ? "✓ " : ""}
              <b>{item.name}</b> {item.guess}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
