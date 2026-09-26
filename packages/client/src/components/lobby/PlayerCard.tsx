import { motion } from "framer-motion";
import type { Player } from "@inkriot/shared";
import "./PlayerCard.css";

export function PlayerCard({ player, isSelf, rotate }: { player: Player; isSelf: boolean; rotate: number }) {
  const initial = player.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <motion.div
      layout
      className="player-card"
      style={{ rotate: `${rotate}deg`, opacity: player.connected ? 1 : 0.5 }}
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: player.connected ? 1 : 0.5, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.4, y: -20, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      whileHover={{ rotate: 0, scale: 1.04, transition: { duration: 0.16, ease: "easeOut" } }}
    >
      <div className="player-avatar" style={{ background: player.color }}>
        {initial}
      </div>
      <span className="player-name">{player.name}</span>
      <div className="player-tags">
        {player.isHost && <span className="tag tag-host">HOST</span>}
        {isSelf && <span className="tag tag-you">YOU</span>}
        {!player.connected && <span className="tag tag-away">AWAY</span>}
      </div>
    </motion.div>
  );
}
