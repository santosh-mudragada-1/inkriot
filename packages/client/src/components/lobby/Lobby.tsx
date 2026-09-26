import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { Button } from "../common/Button";
import { GameSettingsPanel } from "../settings/GameSettingsPanel";
import { PlayerCard } from "./PlayerCard";
import "./Lobby.css";

const ROTATIONS = [-3, 2, -1.5, 3, -2.5, 1.5, -1, 2.5];

export default function Lobby() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === selfId;

  const copyLink = async () => {
    const url = `${window.location.origin}/room/${room.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — user can still read the code */
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-header">
        <div>
          <h1 className="lobby-title">The room is filling up</h1>
          <p className="lobby-subtitle">Share the code. Everyone draws eventually.</p>
        </div>
        <div className="lobby-room-info">
          <div className="room-code-badge">
            <span>ROOM CODE</span>
            <strong>{room.code}</strong>
          </div>
          <Button variant="secondary" onClick={copyLink}>
            {copied ? "Copied!" : "Copy invite link"}
          </Button>
        </div>
      </div>

      <div className="lobby-players">
        <AnimatePresence>
          {room.players.map((p, i) => (
            <PlayerCard key={p.id} player={p} isSelf={p.id === selfId} rotate={ROTATIONS[i % ROTATIONS.length]} />
          ))}
        </AnimatePresence>
      </div>

      <p className="lobby-count">
        Players: {room.players.length}/{room.settings.maxPlayers}
      </p>

      {isHost ? (
        <GameSettingsPanel />
      ) : (
        <div className="lobby-footer">
          <div className="lobby-settings-preview">
            <span>{room.settings.maxPlayers} players</span>
            <span>·</span>
            <span>{room.settings.drawSeconds}s to draw</span>
            <span>·</span>
            <span>
              {room.settings.totalRounds} round{room.settings.totalRounds > 1 ? "s" : ""}
            </span>
          </div>
          <motion.span
            className="lobby-waiting"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            Waiting for host to start...
          </motion.span>
        </div>
      )}
    </div>
  );
}
