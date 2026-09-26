import { AnimatePresence, motion } from "framer-motion";
import "./HintWord.css";

export function HintWord({ pattern }: { pattern: (string | null)[] }) {
  return (
    <div className="hint-word">
      {pattern.map((ch, i) => {
        if (ch === " ") return <span key={i} className="hint-gap" />;
        return (
          <span key={i} className="hint-slot">
            <AnimatePresence mode="wait" initial={false}>
              {ch ? (
                <motion.span
                  key="letter"
                  className="hint-letter"
                  initial={{ opacity: 0, y: -22, scale: 0.3, rotate: -18 }}
                  animate={{ opacity: 1, y: 0, scale: [0.3, 1.5, 1], rotate: 0 }}
                  transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  {ch.toUpperCase()}
                </motion.span>
              ) : (
                <motion.span key="blank" className="hint-blank" />
              )}
            </AnimatePresence>
          </span>
        );
      })}
    </div>
  );
}
