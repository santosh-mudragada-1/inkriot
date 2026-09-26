import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { WORD_LIST } from "@inkriot/shared";
import { Button } from "../components/common/Button";
import { Logo } from "../components/common/Logo";
import { ProfileCard } from "../components/profile/ProfileCard";
import { StickerBook } from "../components/profile/StickerBook";
import { PaperDoodles } from "../components/settings/PaperDoodles";
import { useRoomActions } from "../hooks/useRoomActions";
import { useProfile } from "../lib/profile";
import { audio } from "../lib/audio/AudioManager";
import "./LandingPage.css";

const HEADLINE = [
  { word: "DRAW.", color: "var(--color-sun)", tilt: -3 },
  { word: "GUESS.", color: "var(--color-gum)", tilt: 2 },
  { word: "CHAOS.", color: "var(--color-tomato)", tilt: -1.5 },
];

const STEPS = [
  { emoji: "🃏", title: "Pick a word", body: "The artist chooses one of three: easy, medium or hard." },
  { emoji: "✏️", title: "Draw it", body: "Everyone else races to type the answer before time runs out." },
  { emoji: "⚡", title: "Score big", body: "Faster guesses score more. Streaks stack bonus points." },
];

// A shuffled slice of real prompts for the ticker, fixed per page load.
const TICKER = [...WORD_LIST].sort(() => Math.random() - 0.5).slice(0, 18);
const TICKER_COLORS = ["var(--color-tomato)", "var(--color-grape)", "var(--color-mint)", "var(--color-sky)", "var(--color-gum)"];

export default function LandingPage() {
  const nickname = useProfile((s) => s.nickname);
  const [code, setCode] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const { createRoom, joinRoom, pending, error, setError } = useRoomActions();

  useEffect(() => {
    audio.setMusicMood("lobby");
  }, []);

  const requireName = () => {
    if (nickname.trim()) {
      setNameError(null);
      return true;
    }
    setNameError("Pick a name first — it's how friends will spot you.");
    document.getElementById("nickname")?.focus();
    audio.playWrong();
    return false;
  };

  const create = () => {
    if (!requireName()) return;
    createRoom(nickname.trim());
  };

  const join = (e: FormEvent) => {
    e.preventDefault();
    if (!requireName()) return;
    if (code.trim().length < 4) {
      setError("Room codes are 4 characters.");
      return;
    }
    joinRoom(code, nickname.trim());
  };

  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
      </header>

      <main className="landing-main">
        <section className="landing-copy">
          <PaperDoodles />
          <p className="landing-eyebrow hand">a drawing &amp; guessing party game ✦ free, no signup</p>
          <h1 className="landing-headline">
            {HEADLINE.map((h, i) => (
              <motion.span
                key={h.word}
                className="headline-sticker"
                style={{ ["--sticker" as string]: h.color }}
                initial={{ scale: 1.8, opacity: 0, rotate: h.tilt * 4 }}
                animate={{ scale: 1, opacity: 1, rotate: h.tilt }}
                transition={{ delay: 0.25 + i * 0.16, type: "spring", stiffness: 520, damping: 17 }}
                whileHover={{ rotate: -h.tilt, scale: 1.04 }}
              >
                {h.word}
              </motion.span>
            ))}
          </h1>
          <p className="landing-sub">
            One person draws, everyone else races to guess. Share a 4-letter code and your friends are in — no
            downloads, no accounts.
          </p>

          <div className="landing-cta">
            <Button variant="primary" size="lg" display onClick={create} disabled={pending}>
              {pending ? "Opening…" : "Create a room"}
            </Button>
            <form className="join-inline" onSubmit={join}>
              <label className="join-label hand" htmlFor="code">
                got a code?
              </label>
              <div className="join-row">
                <input
                  id="code"
                  className="join-code"
                  placeholder="ABCD"
                  maxLength={4}
                  value={code}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                    setError(null);
                  }}
                />
                <Button type="submit" variant="accent2" disabled={pending || code.length < 4}>
                  Join →
                </Button>
              </div>
            </form>
          </div>
          {error && <p className="entry-error landing-error">{error}</p>}
        </section>

        <aside className="landing-side">
          <ProfileCard nameError={nameError} onNameEnter={create} />
          <StickerBook />
        </aside>
      </main>

      <section className="how" aria-label="How a round works">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            className="how-step"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
          >
            <span className="how-num">{i + 1}</span>
            <span className="how-emoji" aria-hidden>
              {s.emoji}
            </span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </motion.div>
        ))}
      </section>

      <div className="ticker" aria-hidden>
        <div className="ticker-track">
          {[...TICKER, ...TICKER].map((w, i) => (
            <span key={i} className="ticker-word" style={{ color: TICKER_COLORS[i % TICKER_COLORS.length] }}>
              {w}
              <span className="ticker-star">✦</span>
            </span>
          ))}
        </div>
      </div>

      <footer className="landing-footer hand">made for discord calls, group chats &amp; crowded couches</footer>
    </div>
  );
}
