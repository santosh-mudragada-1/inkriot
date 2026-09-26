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
                  initial={{ opacity: 0, y: -14, scale: 0.4, rotate: -10 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 480, damping: 16 }}
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
