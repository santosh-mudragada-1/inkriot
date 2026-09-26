import { motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import "./RoundRevealOverlay.css";

export function RoundRevealOverlay() {
  const room = useGameStore((s) => s.room)!;
  const artist = room.players.find((p) => p.id === room.artistId);
  const correctGuessers = room.players.filter((p) => p.id !== room.artistId && p.hasGuessedCorrectly);

  return (
    <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="reveal-card"
        initial={{ y: 30, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <span className="reveal-label">The word was</span>
        <h2 className="reveal-word">{room.revealedWord}</h2>
        {artist && (
          <p className="reveal-artist">
            drawn by <b>{artist.name}</b>
          </p>
        )}
        <div className="reveal-guessers">
          {correctGuessers.length === 0 ? (
            <span className="reveal-none">Nobody guessed it this time.</span>
          ) : (
            correctGuessers.map((p) => (
              <span key={p.id} className="reveal-chip" style={{ borderColor: p.color }}>
                ✓ {p.name}
              </span>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
