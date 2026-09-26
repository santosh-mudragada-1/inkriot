import { useRef } from "react";
import { motion } from "framer-motion";
import { REACTIONS } from "@inkriot/shared";
import { socket } from "../../lib/socket";
import "./ReactionBar.css";

const COOLDOWN_MS = 350;

export function ReactionBar() {
  const lastSent = useRef(0);
  return (
    <div className="reaction-bar" aria-label="Send a reaction">
      {REACTIONS.map((emoji) => (
        <motion.button
          key={emoji}
          type="button"
          className="reaction-btn"
          aria-label={`React ${emoji}`}
          whileTap={{ scale: 0.7, rotate: -20 }}
          whileHover={{ y: -4, scale: 1.2 }}
          onClick={() => {
            const now = Date.now();
            if (now - lastSent.current < COOLDOWN_MS) return;
            lastSent.current = now;
            socket.emit("send_reaction", emoji);
          }}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
