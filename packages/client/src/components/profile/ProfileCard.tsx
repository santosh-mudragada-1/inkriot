import { useState } from "react";
import { motion } from "framer-motion";
import { MAX_NICKNAME_LENGTH } from "@inkriot/shared";
import { useProfile } from "../../lib/profile";
import { levelInfo, liveStreak, streakAtRisk, useProgress } from "../../lib/progress";
import { audio } from "../../lib/audio/AudioManager";
import { DoodleAvatar } from "../common/DoodleAvatar";
import { AvatarEditor } from "../common/AvatarEditor";
import "./ProfileCard.css";

export function XpBar({ xp, compact = false }: { xp: number; compact?: boolean }) {
  const info = levelInfo(xp);
  const pct = Math.round((info.into / info.needed) * 100);
  return (
    <div className={`xp-bar ${compact ? "is-compact" : ""}`}>
      <div className="xp-bar-head">
        <span className="xp-level">Lv {info.level}</span>
        <span className="xp-title hand">{info.title}</span>
        <span className="xp-num">
          {info.into}/{info.needed} XP
        </span>
      </div>
      <div className="xp-track" role="progressbar" aria-valuemin={0} aria-valuemax={info.needed} aria-valuenow={info.into} aria-label="Progress to next level">
        <motion.div className="xp-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }} />
      </div>
    </div>
  );
}

export function ProfileCard({ nameError, onNameEnter }: { nameError?: string | null; onNameEnter?: () => void }) {
  const { nickname, avatar, setNickname, setAvatar } = useProfile();
  const progress = useProgress((s) => s.progress);
  const [editing, setEditing] = useState(false);
  const { level } = levelInfo(progress.xp);
  const streak = liveStreak(progress);
  const atRisk = streakAtRisk(progress);

  return (
    <div className="profile-card">
      <span className="tape" style={{ top: -13, right: 28, rotate: "6deg", ["--tape" as string]: "var(--color-sky)" }} />
      <div className="profile-top">
        <motion.button
          type="button"
          className="profile-avatar"
          aria-label="Customize your doodle"
          whileHover={{ rotate: -6, scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            audio.playPop();
            setEditing(true);
          }}
        >
          <DoodleAvatar avatar={avatar} size={112} />
          <span className="profile-avatar-edit">Edit</span>
        </motion.button>

        <div className="profile-id">
          <label className="profile-label hand" htmlFor="nickname">
            your name
          </label>
          <input
            id="nickname"
            className="profile-name-input"
            placeholder="Type a name"
            maxLength={MAX_NICKNAME_LENGTH}
            value={nickname}
            autoComplete="nickname"
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onNameEnter?.()}
            aria-invalid={!!nameError}
          />
          {nameError && <p className="entry-error">{nameError}</p>}
          <XpBar xp={progress.xp} />
        </div>
      </div>

      <div className="profile-stats">
        <div className={`pstat pstat-streak ${streak > 0 ? "is-hot" : ""}`}>
          <span className="pstat-emoji">{streak > 0 ? "🔥" : "🪵"}</span>
          <strong>{streak}</strong>
          <span>day streak</span>
        </div>
        <div className="pstat">
          <span className="pstat-emoji">🎮</span>
          <strong>{progress.stats.gamesPlayed}</strong>
          <span>games</span>
        </div>
        <div className="pstat">
          <span className="pstat-emoji">🏆</span>
          <strong>{progress.stats.wins}</strong>
          <span>wins</span>
        </div>
        <div className="pstat">
          <span className="pstat-emoji">🎯</span>
          <strong>{progress.stats.correctGuesses}</strong>
          <span>guessed</span>
        </div>
      </div>

      {atRisk && (
        <motion.p className="profile-risk" animate={{ rotate: [-1, 1, -1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          Your {progress.streakDays}-day streak ends at midnight. Play one game to keep it!
        </motion.p>
      )}
      {!atRisk && streak === 0 && <p className="profile-hint hand">Play a game today to start a streak — your first game each day earns double XP.</p>}

      <AvatarEditor
        open={editing}
        value={avatar}
        level={level}
        onClose={() => setEditing(false)}
        onSave={(a) => {
          setAvatar(a);
          setEditing(false);
        }}
      />
    </div>
  );
}
