import { motion } from "framer-motion";
import { ACHIEVEMENTS, useProgress } from "../../lib/progress";
import "./StickerBook.css";

const TILTS = [-6, 4, -3, 7, -5, 3, -8, 5, -2, 6];

/** Achievements as a sticker album: earned ones are peeled-and-stuck, locked ones are dotted outlines. */
export function StickerBook() {
  const unlocked = useProgress((s) => s.progress.achievements);
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;

  return (
    <section className="sticker-book" aria-labelledby="sticker-book-title">
      <div className="sticker-book-head">
        <h2 id="sticker-book-title">Sticker book</h2>
        <span className="sticker-book-count">
          {count}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <ul className="sticker-grid">
        {ACHIEVEMENTS.map((a, i) => {
          const got = !!unlocked[a.id];
          return (
            <motion.li
              key={a.id}
              className={`sticker-slot ${got ? "is-got" : ""}`}
              style={{ rotate: got ? `${TILTS[i % TILTS.length]}deg` : "0deg" }}
              whileHover={got ? { scale: 1.15, rotate: 0 } : { scale: 1.05 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              tabIndex={0}
              aria-label={`${a.title}: ${a.desc}${got ? " (unlocked)" : " (locked)"}`}
            >
              <span className="sticker-emoji" aria-hidden>
                {got ? a.emoji : "?"}
              </span>
              <span className="sticker-tip" role="tooltip">
                <strong>{a.title}</strong>
                {a.desc}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
