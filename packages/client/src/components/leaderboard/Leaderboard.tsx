import { AnimatePresence, motion } from "framer-motion";
import type { Player } from "@inkriot/shared";
import { useGameStore } from "../../store/useGameStore";
import { useCountUp } from "../../hooks/useCountUp";
import { useAvatarFor } from "../../hooks/useAvatarFor";
import { DoodleAvatar } from "../common/DoodleAvatar";
import "./Leaderboard.css";

const MEDALS = ["🥇", "🥈", "🥉"];

function Score({ value }: { value: number }) {
  const shown = useCountUp(value);
  return <span className="lb-score">{shown}</span>;
}

function Row({ p, rank, isSelf, isArtist }: { p: Player; rank: number; isSelf: boolean; isArtist: boolean }) {
  const scorePopups = useGameStore((s) => s.scorePopups);
  const lastReaction = useGameStore((s) => {
    for (let i = s.reactions.length - 1; i >= 0; i--) if (s.reactions[i].playerId === p.id) return s.reactions[i];
    return null;
  });
  const avatarFor = useAvatarFor();
  const guessed = p.hasGuessedCorrectly && !isArtist;
  return (
    <motion.div
      layout
      className={`lb-row ${isSelf ? "is-self" : ""} ${guessed ? "is-guessed" : ""} ${isArtist ? "is-artist" : ""}`}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
    >
      <span className="lb-rank">{p.score > 0 && rank <= 3 ? MEDALS[rank - 1] : rank}</span>
      <span className="avatar-disc lb-avatar" style={{ opacity: p.connected ? 1 : 0.4 }}>
        <DoodleAvatar avatar={avatarFor(p)} seed={p.id} size={36} crop="bust" />
      </span>
      <AnimatePresence>
        {lastReaction && (
          <motion.span
            key={lastReaction.id}
            className="lb-reaction"
            initial={{ scale: 0, rotate: -30, y: 6 }}
            animate={{ scale: [0, 1.4, 1], rotate: [-30, 10, -6], y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {lastReaction.emoji}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="lb-name">
        <span className="lb-name-text">
          {p.name}
          {isSelf && <em> (you)</em>}
        </span>
        <span className="lb-badges">
          {isArtist && <span className="lb-chip chip-draw">✏️ drawing</span>}
          {guessed && <span className="lb-chip chip-got">✓ got it</span>}
          {p.streak >= 2 && <span className="lb-chip chip-fire">🔥×{p.streak}</span>}
        </span>
      </span>
      <Score value={p.score} />
      <AnimatePresence>
        {scorePopups
          .filter((s) => s.playerId === p.id)
          .map((s) => (
            <motion.span
              key={s.id}
              className="lb-popup"
              initial={{ opacity: 0, y: 6, scale: 0.5 }}
              animate={{ opacity: 1, y: -30, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              +{s.amount}
            </motion.span>
          ))}
      </AnimatePresence>
    </motion.div>
  );
}

export function Leaderboard() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">Scoreboard</h3>
      <div className="leaderboard-list">
        {sorted.map((p, i) => (
          <Row key={p.id} p={p} rank={i + 1} isSelf={p.id === selfId} isArtist={p.id === room.artistId} />
        ))}
      </div>
    </div>
  );
}
