import { motion } from "framer-motion";
import { audio } from "../../lib/audio/AudioManager";
import "./Logo.css";

const LETTERS = "INKRIOT".split("");
const FILLS = ["var(--color-tomato)", "var(--color-sun)", "var(--color-gum)", "var(--color-mint)", "var(--color-sky)", "var(--color-grape)", "var(--color-tomato)"];
const TILTS = [-8, 5, -4, 7, -6, 4, -3];

/** The wordmark: each letter is its own sticker that boings when hovered. */
export function Logo({ size = "md", onClick }: { size?: "sm" | "md"; onClick?: () => void }) {
  return (
    <span className={`logo logo-${size}`} role="img" aria-label="INKRIOT" onClick={onClick} data-clickable={onClick ? "" : undefined}>
      {LETTERS.map((ch, i) => (
        <motion.span
          key={i}
          className="logo-letter"
          aria-hidden
          style={{ background: FILLS[i], rotate: `${TILTS[i]}deg` }}
          initial={{ y: -30, opacity: 0, scale: 1.6 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 * i, type: "spring", stiffness: 600, damping: 18 }}
          whileHover={{ y: -6, rotate: TILTS[i] * -1.5, scale: 1.15 }}
          onHoverStart={() => audio.playHover()}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}
