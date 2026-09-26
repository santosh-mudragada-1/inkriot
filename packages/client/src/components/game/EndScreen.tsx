import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Player } from "@inkriot/shared";
import { useGameStore } from "../../store/useGameStore";
import { socket } from "../../lib/socket";
import { audio } from "../../lib/audio/AudioManager";
import { confetti } from "../../lib/juice";
import { levelInfo, useProgress } from "../../lib/progress";
import { useCountUp } from "../../hooks/useCountUp";
import { useAvatarFor } from "../../hooks/useAvatarFor";
import { Button } from "../common/Button";
import { DoodleAvatar } from "../common/DoodleAvatar";
import { Logo } from "../common/Logo";
import { XpBar } from "../profile/ProfileCard";
import "./EndScreen.css";

const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd left-to-right
const PODIUM_COLORS = ["var(--color-sun)", "var(--color-sky)", "var(--color-gum)"];
const PODIUM_HEIGHTS = [150, 110, 80];

function PodiumSpot({ player, place, isSelf }: { player: Player; place: number; isSelf: boolean }) {
  const score = useCountUp(player.score, 1400);
  const avatarFor = useAvatarFor();
  return (
    <motion.div
      className={`podium-spot place-${place + 1}`}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 + (2 - place) * 0.35, type: "spring", stiffness: 260, damping: 18 }}
    >
      <motion.div
        className="podium-avatar"
        animate={place === 0 ? { y: [0, -10, 0], rotate: [-4, 4, -4] } : { y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: place === 0 ? 1.2 : 2 }}
      >
        {place === 0 && <span className="podium-crown">👑</span>}
        <DoodleAvatar avatar={avatarFor(player)} seed={player.id} size={place === 0 ? 120 : 90} />
      </motion.div>
      <span className="podium-name">
        {player.name}
        {isSelf && <em className="hand"> (you!)</em>}
      </span>
      <div className="podium-block" style={{ height: PODIUM_HEIGHTS[place], background: PODIUM_COLORS[place] }}>
        <span className="podium-place">{place + 1}</span>
        <span className="podium-score">{score}</span>
      </div>
    </motion.div>
  );
}

function XpSummary() {
  const result = useProgress((s) => s.lastResult);
  const xp = useProgress((s) => s.progress.xp);
  const gained = useCountUp(result?.xpGained ?? 0, 1600);
  if (!result) return null;
  const levelled = result.levelAfter > result.levelBefore;
  return (
    <motion.section
      className="xp-summary"
      initial={{ opacity: 0, y: 30, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: -0.8 }}
      transition={{ delay: 1.6, type: "spring", stiffness: 260, damping: 22 }}
    >
      <span className="tape" style={{ top: -12, left: 24, rotate: "-4deg", ["--tape" as string]: "var(--color-sun)" }} />
      <div className="xp-summary-head">
        <h2>Your haul</h2>
        <span className="xp-gained">+{gained} XP</span>
      </div>
      <ul className="xp-lines">
        {result.lines.map((l, i) => (
          <motion.li key={l.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.8 + i * 0.12 }}>
            <span>{l.label}</span>
            <b>+{l.xp}</b>
          </motion.li>
        ))}
      </ul>
      <XpBar xp={xp} />
      {levelled && (
        <p className="xp-levelup">
          ⬆ Level {result.levelAfter}! <span className="hand">{levelInfo(xp).title}</span>
        </p>
      )}
      {result.newAchievements.length > 0 && (
        <div className="xp-new-stickers">
          <span className="hand">new stickers:</span>
          {result.newAchievements.map((a) => (
            <span key={a.id} className="xp-new-sticker" title={`${a.title} — ${a.desc}`}>
              {a.emoji} {a.title}
            </span>
          ))}
        </div>
      )}
    </motion.section>
  );
}

export default function EndScreen() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const gallery = useGameStore((s) => s.gallery);
  const navigate = useNavigate();
  const avatarFor = useAvatarFor();
  const [shared, setShared] = useState(false);
  const isHost = room.hostId === selfId;
  const played = useRef(false);

  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const selfRank = sorted.findIndex((p) => p.id === selfId) + 1;
  const iWon = selfRank === 1 && sorted.length > 1;

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    audio.setMusicMood("lobby");
    audio.setMusicDuck(1);
    window.setTimeout(() => {
      audio.playWinner();
      confetti.rain(iWon ? 260 : 140);
    }, 900);
  }, [iWon]);

  const shareResults = async () => {
    const medals = ["🥇", "🥈", "🥉"];
    const lines = [
      `INKRIOT — room ${room.code}`,
      ...sorted.map((p, i) => `${medals[i] ?? `${i + 1}.`} ${p.name} — ${p.score}`),
      "",
      `Play with us: ${window.location.origin}/room/${room.code}`,
    ];
    const text = lines.join("\n");
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setShared(true);
      audio.playPop(1.3);
      setTimeout(() => setShared(false), 1800);
    } catch {
      /* share dismissed or clipboard unavailable */
    }
  };

  const nameOf = (id: string | null) => room.players.find((p) => p.id === id)?.name ?? "someone";

  return (
    <div className="end-screen">
      <header className="end-header">
        <Logo size="sm" onClick={() => navigate("/")} />
      </header>

      <motion.h1
        className="end-title"
        initial={{ scale: 2.4, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: -2, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 16 }}
      >
        {iWon ? "You won!!" : selfRank > 0 && selfRank <= 3 && sorted.length > 2 ? "On the podium!" : "Game over!"}
      </motion.h1>
      <p className="end-sub hand">
        {selfRank > 0 ? `you finished #${selfRank} of ${sorted.length}` : "what a game"} · {room.totalRounds} round
        {room.totalRounds > 1 ? "s" : ""}
      </p>

      <div className="podium">
        {PODIUM_ORDER.filter((i) => podium[i]).map((i) => (
          <PodiumSpot key={podium[i].id} player={podium[i]} place={i} isSelf={podium[i].id === selfId} />
        ))}
      </div>

      {rest.length > 0 && (
        <ol className="end-rest" start={4}>
          {rest.map((p) => (
            <li key={p.id} className={p.id === selfId ? "is-self" : ""}>
              <span className="avatar-disc end-rest-avatar">
                <DoodleAvatar avatar={avatarFor(p)} seed={p.id} size={32} crop="bust" />
              </span>
              <span className="end-rest-name">{p.name}</span>
              <b>{p.score}</b>
            </li>
          ))}
        </ol>
      )}

      <motion.div className="end-actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
        {isHost ? (
          <Button variant="primary" size="lg" display onClick={() => socket.emit("play_again")}>
            Rematch!
          </Button>
        ) : (
          <span className="end-waiting hand">waiting for {nameOf(room.hostId)} to start a rematch…</span>
        )}
        <Button variant="accent2" onClick={shareResults}>
          {shared ? "Copied! ✓" : "Share results"}
        </Button>
        <Button variant="ghost" onClick={() => navigate("/")}>
          Back to home
        </Button>
      </motion.div>

      <div className="end-grid">
        <XpSummary />

        {room.awards && room.awards.length > 0 && (
          <section className="end-awards" aria-label="Awards">
            {room.awards.map((a, i) => (
              <motion.div
                key={a.title}
                className="end-award-card"
                initial={{ opacity: 0, scale: 0.6, rotate: 10 }}
                animate={{ opacity: 1, scale: 1, rotate: i % 2 ? 2 : -2 }}
                transition={{ delay: 2 + i * 0.12, type: "spring", stiffness: 400, damping: 16 }}
              >
                <span className="award-title">{a.title}</span>
                <strong>{a.playerName ?? "Nobody"}</strong>
                <span className="award-detail">{a.detail}</span>
              </motion.div>
            ))}
          </section>
        )}
      </div>

      {gallery.length > 0 && (
        <section className="gallery" aria-labelledby="gallery-title">
          <h2 id="gallery-title">
            Tonight's gallery <span className="hand">— tap a drawing to save it</span>
          </h2>
          <div className="gallery-grid">
            {gallery.map((g, i) => (
              <motion.a
                key={g.id}
                className="gallery-frame"
                href={g.image}
                download={`inkriot-${g.word.replace(/\s+/g, "-")}.jpg`}
                style={{ rotate: `${[-2, 1.5, -1, 2.5][i % 4]}deg` }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 + i * 0.1, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ rotate: 0, scale: 1.04, y: -4 }}
              >
                <img src={g.image} alt={`Drawing of ${g.word} by ${nameOf(g.artistId)}`} loading="lazy" />
                <span className="gallery-caption">
                  <b>{g.word}</b>
                  <span>
                    by {nameOf(g.artistId)} · {g.guessed} got it
                  </span>
                </span>
              </motion.a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
