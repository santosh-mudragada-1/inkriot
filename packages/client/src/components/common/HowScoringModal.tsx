import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./HowScoringModal.css";

const RULES = [
  {
    title: "Guess fast, score more",
    body: "The sooner you get it, the bigger your points.",
    visual: (
      <div className="hs-bars">
        <span className="hs-bar-row"><i>⚡</i><b className="hs-bar" style={{ width: "100%", background: "var(--color-mint)" }} /></span>
        <span className="hs-bar-row"><i>🙂</i><b className="hs-bar" style={{ width: "58%", background: "var(--color-sun)" }} /></span>
        <span className="hs-bar-row"><i>🐢</i><b className="hs-bar" style={{ width: "22%", background: "var(--color-tomato)" }} /></span>
      </div>
    ),
  },
  {
    title: "Streak bonus",
    body: "Guess every round in a row and each win adds bonus points.",
    visual: (
      <div className="hs-streak">
        <span>🔥</span>
        <span>🔥🔥</span>
        <span>🔥🔥🔥</span>
        <em>bigger bonus →</em>
      </div>
    ),
  },
  {
    title: "Artists win when guessers do",
    body: "Draw so everyone gets it, or so someone gets it fast, and you earn more. Nobody gets it? No points for the artist — and no one loses a streak.",
    visual: (
      <div className="hs-artist">
        <span className="hs-pen">✏️</span>
        <span className="hs-arrow">→</span>
        <span className="hs-faces">🙂🙂🙂</span>
        <span className="hs-arrow">→</span>
        <span className="hs-bonus">+ bonus</span>
      </div>
    ),
  },
];

export function HowScoringModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="hs-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="hs-card"
            role="dialog"
            aria-modal="true"
            aria-label="How scoring works"
            initial={{ opacity: 0, y: 30, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            <h2 className="hs-title">How scoring works</h2>
            <ul className="hs-list">
              {RULES.map((r) => (
                <li key={r.title} className="hs-rule">
                  <div className="hs-visual">{r.visual}</div>
                  <div>
                    <h3>{r.title}</h3>
                    <p>{r.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="hs-close" onClick={onClose}>
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
