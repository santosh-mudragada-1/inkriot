import { motion } from "framer-motion";
import { WORD_SELECTION_SECONDS } from "@inkriot/shared";
import { useGameStore } from "../../store/useGameStore";
import { socket } from "../../lib/socket";
import { audio } from "../../lib/audio/AudioManager";
import { useCountdown } from "../../hooks/useCountdown";
import { DoodleAvatar } from "../common/DoodleAvatar";
import "./WordSelectOverlay.css";

const PICK_HINT = { easy: "Pick one to draw", medium: "Pick one to draw", hard: "Pick one — brace yourself" } as const;

export function WordSelectOverlay() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const isArtist = selfId === room.artistId;
  const remainingMs = useCountdown(room.phaseEndsAt);
  const artist = room.players.find((p) => p.id === room.artistId);
  const secs = Math.ceil(remainingMs / 1000);
  const mode = room.settings.gameMode;

  return (
    <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {isArtist ? (
        <div className="word-select">
          <motion.p className="word-select-hint" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {PICK_HINT[mode]}
          </motion.p>
          <div className="word-cards">
            {(room.wordChoices ?? []).map((word, i) => (
              <motion.button
                key={word}
                className={`word-card diff-${mode}`}
                initial={{ opacity: 0, y: 60, rotateY: 90, rotate: (i - 1) * 8 }}
                animate={{ opacity: 1, y: 0, rotateY: 0, rotate: (i - 1) * 4 }}
                transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ y: -12, rotate: 0, scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onHoverStart={() => audio.playHover()}
                onClick={() => {
                  audio.playWordSelect();
                  socket.emit("select_word", word);
                }}
              >
                <span className="word-card-word">{word}</span>
                <span className="word-card-meta">{word.replace(/[^a-z]/gi, "").length} letters</span>
              </motion.button>
            ))}
          </div>
          <p className={`word-select-timer hand ${secs <= 4 ? "urgent" : ""}`}>
            auto-picks in {secs}s
          </p>
        </div>
      ) : (
        <motion.div
          className="waiting-card"
          initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: -1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <motion.div animate={{ rotate: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}>
            <DoodleAvatar avatar={artist?.avatar} seed={artist?.id} size={110} />
          </motion.div>
          <p className="waiting-text">
            <b>{artist?.name ?? "Someone"}</b> is picking a word…
          </p>
          <span className="hand waiting-sub">get your typing fingers ready</span>
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
