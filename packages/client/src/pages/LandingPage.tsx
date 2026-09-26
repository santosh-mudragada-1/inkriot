import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeroScene } from "../components/landing/HeroScene";
import { Button } from "../components/common/Button";
import { useRoomActions } from "../hooks/useRoomActions";
import { loadNickname } from "../lib/session";
import "./LandingPage.css";

type Mode = "closed" | "create" | "join";

const LINES = ["DRAW.", "GUESS.", "CHAOS."];

export default function LandingPage() {
  const [mode, setMode] = useState<Mode>("closed");
  const [nickname, setNickname] = useState(loadNickname());
  const [code, setCode] = useState("");
  const { createRoom, joinRoom, pending, error, setError } = useRoomActions();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return setError("Give yourself a name first.");
    if (mode === "create") createRoom(nickname.trim());
    if (mode === "join") {
      if (code.trim().length < 4) return setError("Room codes are 4 characters.");
      joinRoom(code, nickname.trim());
    }
  };

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="brand-mark">INKRIOT</span>
      </header>

      <main className="landing-hero">
        <div className="landing-copy">
          <h1 className="landing-headline">
            {LINES.map((line, i) => (
              <motion.span
                key={line}
                className="headline-line"
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.09, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {line}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="landing-sub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            A fast, funny drawing party for you and your people. No signup. No app. Just a room code and
            questionable art.
          </motion.p>

          <div className="landing-cta-area">
            <AnimatePresence mode="wait">
              {mode === "closed" ? (
                <motion.div
                  key="ctas"
                  className="cta-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.55, duration: 0.4 }}
                >
                  <Button variant="primary" size="lg" onClick={() => setMode("create")}>
                    Create a Room
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => setMode("join")}>
                    Join a Room
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  className="entry-panel"
                  onSubmit={submit}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 340, damping: 28 }}
                >
                  <label className="entry-label" htmlFor="nickname">
                    {mode === "create" ? "What should we call you?" : "What's your name?"}
                  </label>
                  <input
                    id="nickname"
                    className="entry-input"
                    placeholder="Nickname"
                    maxLength={16}
                    autoFocus
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                  {mode === "join" && (
                    <>
                      <label className="entry-label" htmlFor="code">
                        Room code
                      </label>
                      <input
                        id="code"
                        className="entry-input entry-input-code"
                        placeholder="X7KP"
                        maxLength={4}
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                      />
                    </>
                  )}
                  {error && <p className="entry-error">{error}</p>}
                  <div className="entry-actions">
                    <Button type="button" variant="ghost" onClick={() => setMode("closed")}>
                      Back
                    </Button>
                    <Button type="submit" variant={mode === "create" ? "primary" : "accent2"} disabled={pending}>
                      {pending ? "..." : mode === "create" ? "Let's go" : "Join"}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          className="landing-scene"
          initial={{ opacity: 0, scale: 0.92, rotate: 4 }}
          animate={{ opacity: 1, scale: 1, rotate: 1.4 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroScene />
        </motion.div>
      </main>

      <footer className="landing-footer">
        <span>Works great on Discord calls, group chats, and couches.</span>
      </footer>
    </div>
  );
}
