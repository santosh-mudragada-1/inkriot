import { motion } from "framer-motion";
import type { Player } from "@inkriot/shared";
import { DoodleAvatar } from "../common/DoodleAvatar";
import "./PlayerCard.css";

export function PlayerCard({ player, isSelf, rotate }: { player: Player; isSelf: boolean; rotate: number }) {
  return (
    <motion.div
      layout
      className={`player-card ${isSelf ? "is-self" : ""}`}
      style={{ rotate: `${rotate}deg`, ["--player" as string]: player.color }}
      initial={{ opacity: 0, scale: 1.8, y: -30 }}
      animate={{ opacity: player.connected ? 1 : 0.45, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.3, rotate: 40, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 520, damping: 18 }}
      whileHover={{ rotate: 0, scale: 1.06, y: -4 }}
    >
      <div className="player-avatar-wrap">
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.2 + (rotate % 1), repeat: Infinity, ease: "easeInOut" }}>
          <DoodleAvatar avatar={player.avatar} seed={player.id} size={84} />
        </motion.div>
      </div>
      <span className="player-name">{player.name}</span>
      <div className="player-tags">
        {player.isHost && <span className="tag tag-host">👑 host</span>}
        {!player.connected && <span className="tag tag-away">away</span>}
      </div>
      {isSelf && <span className="player-you hand">that's you!</span>}
    </motion.div>
  );
}
