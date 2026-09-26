import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { MAX_GUESS_LENGTH } from "@inkriot/shared";
import { socket } from "../../lib/socket";
import { useGameStore } from "../../store/useGameStore";
import "./GuessInput.css";

export function GuessInput({ disabled, placeholder }: { disabled: boolean; placeholder: string }) {
  const [value, setValue] = useState("");
  const [close, setClose] = useState(false);
  const controls = useAnimationControls();
  const inputRef = useRef<HTMLInputElement>(null);
  const selfId = useGameStore((s) => s.selfId);
  const lastMine = useGameStore((s) => {
    for (let i = s.guesses.length - 1; i >= 0; i--) if (s.guesses[i].playerId === s.selfId) return s.guesses[i];
    return null;
  });

  // React to the server's verdict on my latest guess.
  useEffect(() => {
    if (!lastMine || lastMine.playerId !== selfId || lastMine.correct) return;
    if (lastMine.close) {
      setClose(true);
      const t = window.setTimeout(() => setClose(false), 1600);
      void controls.start({ scale: [1, 1.05, 1], transition: { duration: 0.3 } });
      return () => window.clearTimeout(t);
    }
    void controls.start({ x: [0, -9, 8, -6, 4, 0], transition: { duration: 0.35 } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMine?.id]);

  // Re-focus the box when guessing opens so players can type immediately.
  useEffect(() => {
    if (!disabled && window.matchMedia("(pointer: fine)").matches && inputRef.current?.offsetParent) inputRef.current.focus();
  }, [disabled]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    socket.emit("submit_guess", text);
    setValue("");
  };

  return (
    <form className="guess-input-row" onSubmit={submit}>
      <motion.div className={`guess-input-wrap ${close ? "is-close" : ""}`} animate={controls}>
        <input
          ref={inputRef}
          className="guess-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          maxLength={MAX_GUESS_LENGTH}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          aria-label="Your guess"
        />
        <button type="submit" className="guess-send" disabled={disabled || !value.trim()} aria-label="Send guess">
          ➜
        </button>
        {close && <span className="guess-close-flag hand">so close!</span>}
      </motion.div>
    </form>
  );
}
