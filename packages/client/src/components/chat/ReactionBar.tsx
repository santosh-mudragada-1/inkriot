import { motion } from "framer-motion";
import { REACTIONS } from "@inkriot/shared";
import { socket } from "../../lib/socket";
import "./ReactionBar.css";

export function ReactionBar() {
  return (
    <div className="reaction-bar">
      {REACTIONS.map((emoji) => (
        <motion.button
          key={emoji}
          className="reaction-btn"
          whileTap={{ scale: 0.8 }}
          whileHover={{ y: -3 }}
          onClick={() => socket.emit("send_reaction", emoji)}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
