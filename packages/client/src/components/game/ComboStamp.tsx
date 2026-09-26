import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import "./ComboStamp.css";

interface Stamp {
  id: string;
  amount: number;
  headline: string;
  sub: string | null;
  color: string;
}

const HYPE = ["NICE!", "YES!", "BOOM!", "NAILED IT!", "WOW!", "SNAP!"];

/**
 * Big rubber-stamp feedback over the canvas when *you* score: points, combo level,
 * and a "FIRST!" call-out. Artist bonuses at round end get a stamp too.
 */
export function ComboStamp() {
  const selfId = useGameStore((s) => s.selfId);
  const popups = useGameStore((s) => s.scorePopups);
  const [stamp, setStamp] = useState<Stamp | null>(null);

  const mine = popups.filter((p) => p.playerId === selfId);
  const latest = mine[mine.length - 1];

  useEffect(() => {
    if (!latest) return;
    const { room, guesses } = useGameStore.getState();
    if (!room) return;
    const me = room.players.find((p) => p.id === selfId);
    const isArtist = room.artistId === selfId;
    // score_popup arrives just before its guess_added, so this counts *earlier* correct guesses
    const correctSoFar = guesses.filter((g) => g.correct).length;
    const combo = (me?.streak ?? 0) + (isArtist ? 0 : 1);

    let headline = HYPE[Math.floor(Math.random() * HYPE.length)];
    let sub: string | null = null;
    let color = "var(--color-mint)";
    if (isArtist) {
      headline = "ARTIST BONUS";
      sub = "people got your drawing!";
      color = "var(--color-sky)";
    } else if (correctSoFar === 0) {
      headline = "FIRST!";
      sub = combo >= 2 ? `combo ×${combo} 🔥` : "fastest fingers";
      color = "var(--color-sun)";
    } else if (combo >= 2) {
      sub = `combo ×${combo} 🔥`;
      color = combo >= 4 ? "var(--color-tomato)" : "var(--color-gum)";
    }
    setStamp({ id: latest.id, amount: latest.amount, headline, sub, color });
    const t = window.setTimeout(() => setStamp(null), 2400);
    return () => window.clearTimeout(t);
    // only re-run for a new popup id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id]);

  return (
    <div className="combo-layer" aria-live="polite">
      <AnimatePresence>
        {stamp && (
          <motion.div
            key={stamp.id}
            className="combo-stamp"
            style={{ ["--stamp" as string]: stamp.color }}
            initial={{ scale: 2.6, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: -6, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0, y: -40, transition: { duration: 0.45 } }}
            transition={{ type: "spring", stiffness: 380, damping: 13 }}
          >
            <span className="combo-headline">{stamp.headline}</span>
            <span className="combo-points">+{stamp.amount}</span>
            {stamp.sub && <span className="combo-sub hand">{stamp.sub}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
