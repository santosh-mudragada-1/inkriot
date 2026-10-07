import { motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { useAvatarFor } from "../../hooks/useAvatarFor";
import { DoodleAvatar } from "../common/DoodleAvatar";
import "./RoundRevealOverlay.css";

export function RoundRevealOverlay() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const avatarFor = useAvatarFor();
  const artist = room.players.find((p) => p.id === room.artistId);
  const guessers = room.players.filter((p) => p.id !== room.artistId);
  const correct = guessers.filter((p) => p.hasGuessedCorrectly).sort((a, b) => (a.lastGuessMs ?? 0) - (b.lastGuessMs ?? 0));
  const me = room.players.find((p) => p.id === selfId);
  const everyone = guessers.length > 0 && correct.length === guessers.length;

  const outcome = room.turnOutcome;
  const iAmArtist = selfId === room.artistId;

  if (outcome === "skipped" || outcome === "artist_left") {
    return (
      <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="reveal-card">
          <span className="reveal-label hand">turn skipped</span>
          <h2 className="reveal-skipped">{outcome === "skipped" ? `${iAmArtist ? "You were" : `${artist?.name ?? "The artist"} was`} offline` : `${artist?.name ?? "The artist"} left`}</h2>
          <p className="reveal-shield">🛡️ No points this turn — and nobody loses a streak.</p>
        </div>
      </motion.div>
    );
  }

  let verdict = "Nobody got it. Tough crowd!";
  if (outcome === "artist_fault") verdict = iAmArtist ? "Nobody guessed it. No points this time." : "Nobody got that one — that's on the artist.";
  else if (everyone) verdict = "Everyone got it — masterpiece!";
  else if (correct.length > 0) verdict = `${correct.length} of ${guessers.length} got it`;

  return (
    <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="reveal-card">
        <span className="reveal-label hand">the word was…</span>
        <motion.h2
          className="reveal-word"
          initial={{ scale: 3, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: -4, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 13, delay: 0.25 }}
        >
          {room.revealedWord}
        </motion.h2>
        {artist && (
          <p className="reveal-artist">
            <DoodleAvatar avatar={avatarFor(artist)} seed={artist.id} size={30} crop="bust" /> drawn by <b>{artist.id === selfId ? "you" : artist.name}</b>
          </p>
        )}
        <motion.p className={`reveal-verdict ${everyone ? "is-perfect" : correct.length === 0 ? "is-none" : ""}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          {verdict}
        </motion.p>
        {outcome === "artist_fault" && !iAmArtist && <p className="reveal-shield">🛡️ Streaks are safe.</p>}
        {correct.length > 0 && (
          <ol className="reveal-guessers">
            {correct.map((p, i) => (
              <motion.li
                key={p.id}
                className={`reveal-chip ${p.id === selfId ? "is-self" : ""}`}
                initial={{ opacity: 0, scale: 0.4, rotate: 10 }}
                animate={{ opacity: 1, scale: 1, rotate: i % 2 ? 2 : -2 }}
                transition={{ delay: 1.1 + i * 0.18, type: "spring", stiffness: 360, damping: 15 }}
              >
                <span className="reveal-place">{i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `${i + 1}th`}</span>
                <DoodleAvatar avatar={avatarFor(p)} seed={p.id} size={26} crop="bust" />
                {p.name}
                {p.lastGuessMs !== null && <span className="reveal-time">{(p.lastGuessMs / 1000).toFixed(1)}s</span>}
              </motion.li>
            ))}
          </ol>
        )}
        {me && me.id !== room.artistId && !me.hasGuessedCorrectly && outcome !== "artist_fault" && (
          <p className="reveal-nudge hand">you'll get the next one 💪</p>
        )}
      </div>
    </motion.div>
  );
}
