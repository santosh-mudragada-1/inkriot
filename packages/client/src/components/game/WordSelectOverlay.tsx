import { motion } from "framer-motion";
import { WORD_SELECTION_SECONDS } from "@inkriot/shared";
import { useGameStore } from "../../store/useGameStore";
import { socket } from "../../lib/socket";
import { audio } from "../../lib/audio/AudioManager";
import { useCountdown } from "../../hooks/useCountdown";
import "./WordSelectOverlay.css";

export function WordSelectOverlay() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const isArtist = selfId === room.artistId;
  const remainingMs = useCountdown(room.phaseEndsAt);
  const artist = room.players.find((p) => p.id === room.artistId);

  return (
    <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {isArtist ? (
        <div className="word-select">
          <p className="word-select-hint">Pick something to draw</p>
          <div className="word-cards">
            {(room.wordChoices ?? []).map((word, i) => (
              <motion.button
                key={word}
                className="word-card"
                initial={{ opacity: 0, y: 24, rotate: (i - 1) * 6 }}
                animate={{ opacity: 1, y: 0, rotate: (i - 1) * 4 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 22 }}
                whileHover={{ y: -8, rotate: 0, scale: 1.04, transition: { duration: 0.16, ease: "easeOut" } }}
                whileTap={{ scale: 0.96, transition: { duration: 0.08 } }}
                onClick={() => {
                  audio.playWordSelect();
                  socket.emit("select_word", word);
                }}
              >
                {word}
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          className="waiting-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="waiting-avatar" style={{ background: artist?.color }}>
            {artist?.name.charAt(0).toUpperCase()}
          </div>
          <p>
            <b>{artist?.name ?? "Someone"}</b> is choosing a word…
          </p>
          <div className="waiting-bar">
            <motion.div
              className="waiting-bar-fill"
              animate={{ width: `${Math.max(0, (remainingMs / (WORD_SELECTION_SECONDS * 1000)) * 100)}%` }}
              transition={{ ease: "linear", duration: 0.2 }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
