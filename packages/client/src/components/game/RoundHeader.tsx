import { useGameStore } from "../../store/useGameStore";
import { useCountdown } from "../../hooks/useCountdown";
import { audio } from "../../lib/audio/AudioManager";
import { useEffect, useRef } from "react";
import { HintWord } from "./HintWord";
import "./RoundHeader.css";

export function RoundHeader() {
  const room = useGameStore((s) => s.room)!;
  const remainingMs = useCountdown(room.phase === "DRAWING" ? room.phaseEndsAt : null);
  const seconds = Math.ceil(remainingMs / 1000);
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    if (room.phase !== "DRAWING") return;
    if (seconds <= 10 && seconds > 0 && lastTick.current !== seconds) {
      lastTick.current = seconds;
      audio.playCountdownTick(seconds <= 3);
    }
  }, [seconds, room.phase]);

  const showFullWord = room.phase === "ROUND_REVEAL" && room.revealedWord;
  const showHints = room.phase === "DRAWING" && room.hintPattern;
  const showArtistWord = room.phase === "DRAWING" && room.revealedWord;

  return (
    <div className="round-header">
      <div className="rh-block">
        <span className="rh-label">Round</span>
        <strong>
          {room.round}/{room.totalRounds}
        </strong>
      </div>

      <div className="rh-word">
        {showFullWord || showArtistWord ? (
          room.revealedWord!.toUpperCase()
        ) : showHints ? (
          <HintWord pattern={room.hintPattern!} />
        ) : (
          ""
        )}
      </div>

      <div className={`rh-timer ${seconds <= 10 ? "urgent" : ""}`}>
        {room.phase === "DRAWING" ? seconds : "—"}
      </div>
    </div>
  );
}
