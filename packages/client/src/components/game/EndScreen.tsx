import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { socket } from "../../lib/socket";
import { audio } from "../../lib/audio/AudioManager";
import { Button } from "../common/Button";
import "./EndScreen.css";

export default function EndScreen() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const navigate = useNavigate();
  const [shared, setShared] = useState(false);
  const isHost = room.hostId === selfId;

  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const champion = sorted[0];
  const runnersUp = sorted.slice(1, 4);

  useEffect(() => {
    audio.playWinner();
  }, []);

  const shareResults = async () => {
    const lines = [
      `INKRIOT results for room ${room.code}:`,
      ...sorted.map((p, i) => `${i + 1}. ${p.name} — ${p.score}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="end-screen">
      <motion.div
        className="end-trophy"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
      >
        🏆
      </motion.div>
      <motion.p className="end-kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        Tonight&rsquo;s champion
      </motion.p>
      <motion.h1
        className="end-champion"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
      >
        {champion?.name ?? "—"}
      </motion.h1>
      <p className="end-champion-score">{champion?.score ?? 0} points</p>

      {runnersUp.length > 0 && (
        <div className="end-runners">
          {runnersUp.map((p, i) => (
            <motion.div
              key={p.id}
              className="end-runner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
            >
              <span className="end-runner-rank">{i + 2}</span>
              <span className="end-runner-avatar" style={{ background: p.color }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span>{p.name}</span>
              <span className="end-runner-score">{p.score}</span>
            </motion.div>
          ))}
        </div>
      )}

      {room.awards && room.awards.length > 0 && (
        <div className="end-awards">
          {room.awards.map((a, i) => (
            <motion.div
              key={a.title}
              className="end-award-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.07 }}
            >
              <span className="award-title">{a.title}</span>
              <strong>{a.playerName ?? "Nobody"}</strong>
              <span className="award-detail">{a.detail}</span>
            </motion.div>
          ))}
        </div>
      )}

      <div className="end-actions">
        {isHost ? (
          <Button variant="primary" size="lg" onClick={() => socket.emit("play_again")}>
            Play Again
          </Button>
        ) : (
          <span className="end-waiting">Waiting for host to start a new round…</span>
        )}
        <Button variant="secondary" onClick={() => navigate("/")}>
          Create New Room
        </Button>
        <Button variant="ghost" onClick={shareResults}>
          {shared ? "Copied!" : "Share Results"}
        </Button>
      </div>
    </div>
  );
}
