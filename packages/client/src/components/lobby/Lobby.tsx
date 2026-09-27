import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { PALETTE, useToolStore } from "../../store/useToolStore";
import { audio } from "../../lib/audio/AudioManager";
import { useLeaveRoom } from "../../hooks/useLeaveRoom";
import { Button } from "../common/Button";
import { Logo } from "../common/Logo";
import { Canvas, type CanvasHandle } from "../drawing/Canvas";
import { GameSettingsPanel } from "../settings/GameSettingsPanel";
import { PlayerCard } from "./PlayerCard";
import "./Lobby.css";
import { track } from "../../lib/myAnalytics";

const ROTATIONS = [-4, 3, -2, 4, -3, 2, -1.5, 3.5, -2.5, 1.5, -3.5, 2.5];
const WALL_COLORS = [PALETTE[0], PALETTE[1], PALETTE[3], PALETTE[5], PALETTE[6], PALETTE[7], PALETTE[8]];
const WALL_SIZES = [6, 16];

export default function Lobby() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const leaveRoom = useLeaveRoom();
  const [copied, setCopied] = useState(false);
  const wallRef = useRef<CanvasHandle>(null);
  const { color, size, setColor, setSize } = useToolStore();
  const isHost = room.hostId === selfId;
  const openSeats = Math.max(0, room.settings.maxPlayers - room.players.length);

  useEffect(() => {
    audio.setMusicMood("lobby");
    audio.setMusicDuck(1);
  }, []);

  const copyLink = async () => {
    const url = `${window.location.origin}/room/${room.code}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Join my INKRIOT room", text: `Come draw with me — room ${room.code}`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      track("invite_shared", { from: "lobby" });
      audio.playPop(1.3);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* share dismissed or clipboard unavailable — the code is still on screen */
    }
  };

  return (
    <div className="lobby">
      <header className="lobby-header">
        <Logo size="sm" onClick={leaveRoom} />
        <div className="lobby-room-info">
          <motion.div
            className="room-code-badge"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -3 }}
            transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.1 }}
          >
            <span className="hand">room code</span>
            <strong>{room.code}</strong>
          </motion.div>
          <Button variant="grape" onClick={copyLink}>
            {copied ? "Link copied! ✓" : "Invite friends"}
          </Button>
        </div>
      </header>

      <section className="lobby-players" aria-label="Players in the room">
        <AnimatePresence>
          {room.players.map((p, i) => (
            <PlayerCard key={p.id} player={p} isSelf={p.id === selfId} rotate={ROTATIONS[i % ROTATIONS.length]} />
          ))}
        </AnimatePresence>
        {Array.from({ length: Math.min(openSeats, 4) }).map((_, i) => (
          <button key={`seat-${i}`} type="button" className="open-seat" onClick={copyLink} aria-label="Invite a friend to this seat">
            <span className="open-seat-plus">+</span>
            <span className="hand">{i === 0 ? "invite a friend" : "open seat"}</span>
          </button>
        ))}
      </section>

      <div className="lobby-body">
        <section className="doodle-wall" aria-label="Shared doodle wall">
          <div className="doodle-wall-head">
            <h2>Doodle wall</h2>
            <span className="hand">everyone can draw here while you wait</span>
          </div>
          <div className="doodle-wall-canvas">
            <Canvas ref={wallRef} isArtist active mode="wall" />
          </div>
          <div className="doodle-wall-tools">
            {WALL_COLORS.map((c, i) => (
              <button
                key={c}
                type="button"
                className={`wall-swatch ${color === c ? "active" : ""}`}
                style={{ background: c }}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                onClick={() => {
                  setColor(c);
                  audio.playColorSelect(i);
                }}
              />
            ))}
            <span className="wall-sep" />
            {WALL_SIZES.map((s, i) => (
              <button
                key={s}
                type="button"
                className={`wall-size ${size === s ? "active" : ""}`}
                aria-label={i === 0 ? "Thin brush" : "Thick brush"}
                aria-pressed={size === s}
                onClick={() => {
                  setSize(s);
                  audio.playPop(1 + i * 0.3);
                }}
              >
                <span style={{ width: 6 + i * 8, height: 6 + i * 8 }} />
              </button>
            ))}
            {isHost && (
              <button type="button" className="wall-clear" onClick={() => wallRef.current?.clear()}>
                wipe wall
              </button>
            )}
          </div>
        </section>

        <aside className="lobby-side">
          {isHost ? (
            <GameSettingsPanel />
          ) : (
            <div className="lobby-waiting-card">
              <span className="tape" style={{ top: -12, left: 30, rotate: "-5deg" }} />
              <h2>Get ready!</h2>
              <ul className="lobby-settings-preview">
                <li>
                  <strong>{room.settings.totalRounds}</strong> round{room.settings.totalRounds > 1 ? "s" : ""}
                </li>
                <li>
                  <strong>{room.settings.drawSeconds}s</strong> to draw
                </li>
                <li>
                  up to <strong>{room.settings.maxPlayers}</strong> players
                </li>
              </ul>
              <motion.p className="lobby-waiting hand" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }}>
                waiting for {room.players.find((p) => p.id === room.hostId)?.name ?? "the host"} to start…
              </motion.p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
