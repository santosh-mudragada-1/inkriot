import { useState } from "react";
import { motion } from "framer-motion";
import { audio } from "../../lib/audio/AudioManager";
import "./SoundToggle.css";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(audio.isEnabled());

  return (
    <motion.button
      className="sound-toggle"
      aria-label={enabled ? "Mute sound" : "Unmute sound"}
      whileTap={{ scale: 0.88 }}
      onClick={() => {
        const next = !enabled;
        audio.setEnabled(next);
        setEnabled(next);
        if (next) audio.playToggle();
      }}
    >
      {enabled ? "🔊" : "🔇"}
    </motion.button>
  );
}
