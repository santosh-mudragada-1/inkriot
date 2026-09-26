import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { audio } from "../../lib/audio/AudioManager";
import "./SoundToggle.css";

const subscribe = (fn: () => void) => audio.subscribe(fn);

export function SoundToggle() {
  const sfx = useSyncExternalStore(subscribe, () => audio.isEnabled());
  const music = useSyncExternalStore(subscribe, () => audio.isMusicEnabled());

  return (
    <div className="sound-dock">
      <motion.button
        type="button"
        className={`sound-toggle ${music ? "is-on" : ""}`}
        aria-label={music ? "Turn music off" : "Turn music on"}
        aria-pressed={music}
        title={music ? "Music on" : "Music off"}
        whileTap={{ scale: 0.85, rotate: -10 }}
        whileHover={{ rotate: -8 }}
        onClick={() => {
          audio.setMusicEnabled(!music);
          audio.playToggle();
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V6l11-2v12" />
          <circle cx="6.5" cy="18" r="2.8" fill="currentColor" />
          <circle cx="17.5" cy="16" r="2.8" fill="currentColor" />
          {!music && <path d="M3 3l18 18" stroke="var(--color-tomato)" strokeWidth="3" />}
        </svg>
      </motion.button>
      <motion.button
        type="button"
        className={`sound-toggle ${sfx ? "is-on" : ""}`}
        aria-label={sfx ? "Mute sound effects" : "Unmute sound effects"}
        aria-pressed={sfx}
        title={sfx ? "Sound effects on" : "Sound effects off"}
        whileTap={{ scale: 0.85, rotate: 10 }}
        whileHover={{ rotate: 8 }}
        onClick={() => {
          const next = !sfx;
          audio.setEnabled(next);
          if (next) audio.playToggle();
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
          {sfx ? (
            <>
              <path d="M15.5 9c1 .9 1.5 1.9 1.5 3s-.5 2.1-1.5 3" />
              <path d="M18.5 6.5c1.7 1.5 2.5 3.4 2.5 5.5s-.8 4-2.5 5.5" />
            </>
          ) : (
            <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="var(--color-tomato)" strokeWidth="3" />
          )}
        </svg>
      </motion.button>
    </div>
  );
}
