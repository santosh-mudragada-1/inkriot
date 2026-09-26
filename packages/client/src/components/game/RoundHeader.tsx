import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { wordDifficulty } from "@inkriot/shared";
import { useGameStore } from "../../store/useGameStore";
import { useCountdown } from "../../hooks/useCountdown";
import { audio } from "../../lib/audio/AudioManager";
import { useLeaveRoom } from "../../hooks/useLeaveRoom";
import { useAvatarFor } from "../../hooks/useAvatarFor";
import { Logo } from "../common/Logo";
import { DoodleAvatar } from "../common/DoodleAvatar";
import { HintWord } from "./HintWord";
import "./RoundHeader.css";

const R = 24;
const CIRC = 2 * Math.PI * R;

export function RoundHeader() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const drawing = room.phase === "DRAWING";
  const remainingMs = useCountdown(drawing ? room.phaseEndsAt : null);
  const seconds = Math.ceil(remainingMs / 1000);
  const lastTick = useRef<number | null>(null);
  const artist = room.players.find((p) => p.id === room.artistId);
  const isArtist = selfId === room.artistId;
  const avatarFor = useAvatarFor();
  const leaveRoom = useLeaveRoom();
  const onLogoClick = () => {
    // A game's in progress here, so a stray click shouldn't silently boot you out.
    if (window.confirm("Leave this game and go back home?")) leaveRoom();
  };

  useEffect(() => {
    if (!drawing) return;
    if (seconds <= 10 && seconds > 0 && lastTick.current !== seconds) {
      lastTick.current = seconds;
      audio.playCountdownTick(seconds <= 3);
    }
  }, [seconds, drawing]);

  const fraction = drawing ? Math.max(0, Math.min(1, remainingMs / (room.drawSeconds * 1000))) : 1;
  const urgent = drawing && seconds <= 10;
  const timerColor = fraction > 0.5 ? "var(--color-mint)" : fraction > 0.2 ? "var(--color-sun)" : "var(--color-tomato)";

  const showFullWord = room.phase === "ROUND_REVEAL" && room.revealedWord;
  const showArtistWord = drawing && isArtist && room.revealedWord;
  const showHints = drawing && !isArtist && room.hintPattern;
  const letters = room.hintPattern?.filter((c) => c !== " ").length ?? 0;

  return (
    <header className="round-header">
      <div className="rh-left">
        <Logo size="sm" onClick={onLogoClick} />
        <div className="rh-round">
          <span className="rh-label hand">round</span>
          <span className="rh-pips" aria-label={`Round ${room.round} of ${room.totalRounds}`}>
            {Array.from({ length: room.totalRounds }).map((_, i) => (
              <span key={i} className={`rh-pip ${i < room.round - 1 ? "done" : i === room.round - 1 ? "now" : ""}`} />
            ))}
          </span>
        </div>
      </div>

      <div className="rh-word">
        {showArtistWord ? (
          <>
            <span className="rh-word-label hand">draw this:</span>
            <span className={`rh-artist-word diff-${wordDifficulty(room.revealedWord!)}`}>{room.revealedWord}</span>
          </>
        ) : showFullWord ? (
          <span className="rh-artist-word">{room.revealedWord}</span>
        ) : showHints ? (
          <>
            <span className="rh-word-label hand">
              guess the word <b>{letters} letters</b>
            </span>
            <HintWord pattern={room.hintPattern!} />
          </>
        ) : artist && room.phase === "WORD_SELECTION" ? (
          <span className="rh-choosing">
            <DoodleAvatar avatar={avatarFor(artist)} seed={artist.id} size={34} crop="bust" />
            <span className="hand">{isArtist ? "your turn — pick a word!" : `${artist.name} is picking a word…`}</span>
          </span>
        ) : null}
      </div>

      <div className="rh-right">
        {drawing && artist && !isArtist && (
          <span className="rh-artist" title={`${artist.name} is drawing`}>
            <DoodleAvatar avatar={artist.avatar} seed={artist.id} size={30} crop="bust" />
            <span className="hand">{artist.name} draws</span>
          </span>
        )}
        <motion.div
          className={`rh-timer ${urgent ? "urgent" : ""}`}
          animate={urgent ? { rotate: [-6, 6, -6], scale: seconds <= 3 ? [1, 1.12, 1] : 1 } : { rotate: 0, scale: 1 }}
          transition={urgent ? { repeat: Infinity, duration: seconds <= 3 ? 0.35 : 0.6 } : { duration: 0.2 }}
          role="timer"
          aria-label={drawing ? `${seconds} seconds left` : "Timer paused"}
        >
          <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden>
            <circle cx="30" cy="30" r={R} fill="var(--color-bg-raised)" stroke="var(--color-ink)" strokeWidth="3" />
            <circle
              cx="30"
              cy="30"
              r={R}
              fill="none"
              stroke={timerColor}
              strokeWidth="7"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - fraction)}
              transform="rotate(-90 30 30)"
              style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.4s ease" }}
            />
          </svg>
          <span className="rh-timer-num">{drawing ? seconds : "·"}</span>
        </motion.div>
      </div>
    </header>
  );
}
