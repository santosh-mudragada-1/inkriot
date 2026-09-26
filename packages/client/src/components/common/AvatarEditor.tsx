import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AVATAR_FILLS,
  BODY_COUNT,
  EYES_COUNT,
  HATS,
  MOUTH_COUNT,
  randomAvatar,
  type AvatarConfig,
} from "../../lib/avatar";
import { audio } from "../../lib/audio/AudioManager";
import { DoodleAvatar } from "./DoodleAvatar";
import { Button } from "./Button";
import "./AvatarEditor.css";

type Part = "body" | "eyes" | "mouth";
const PART_COUNTS: Record<Part, number> = { body: BODY_COUNT, eyes: EYES_COUNT, mouth: MOUTH_COUNT };
const PART_LABELS: Record<Part, string> = { body: "Shape", eyes: "Eyes", mouth: "Mouth" };

interface Props {
  open: boolean;
  value: AvatarConfig;
  level: number;
  onClose: () => void;
  onSave: (a: AvatarConfig) => void;
}

export function AvatarEditor(props: Props) {
  // Remount the dialog body each time it opens so the draft starts from the saved avatar.
  return <AnimatePresence>{props.open && <AvatarEditorDialog key="dialog" {...props} />}</AnimatePresence>;
}

function AvatarEditorDialog({ value, level, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(value);
  const [bump, setBump] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const change = (next: AvatarConfig, pitch = 1) => {
    setDraft(next);
    setBump((b) => b + 1);
    audio.playPop(pitch);
  };

  const cycle = (part: Part, dir: 1 | -1) => {
    const n = PART_COUNTS[part];
    change({ ...draft, [part]: (draft[part] + dir + n) % n }, dir > 0 ? 1.2 : 0.9);
  };

  return (
    <motion.div className="avatar-editor-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Customize your doodle"
        className="avatar-editor"
        initial={{ y: 40, rotate: 3, scale: 0.9 }}
        animate={{ y: 0, rotate: -0.6, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="tape" style={{ top: -12, left: "50%", translate: "-50% 0", rotate: "-3deg", ["--tape" as string]: "var(--color-mint)" }} />
        <h2 className="avatar-editor-title">Make your doodle</h2>

        <div className="avatar-editor-body">
          <div className="avatar-editor-stage">
            <motion.div
              key={bump}
              initial={{ scale: 0.86, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 14 }}
            >
              <DoodleAvatar avatar={draft} size={170} />
            </motion.div>
            <Button
              variant="grape"
              onClick={() => {
                audio.playDice();
                setDraft(randomAvatar(level));
                setBump((b) => b + 1);
              }}
            >
              🎲 Surprise me
            </Button>
          </div>

          <div className="avatar-editor-controls">
            {(Object.keys(PART_COUNTS) as Part[]).map((part) => (
              <div className="ae-row" key={part}>
                <span className="ae-label">{PART_LABELS[part]}</span>
                <div className="ae-stepper">
                  <button type="button" aria-label={`Previous ${PART_LABELS[part]}`} onClick={() => cycle(part, -1)}>
                    ‹
                  </button>
                  <span className="ae-count">
                    {draft[part] + 1}/{PART_COUNTS[part]}
                  </span>
                  <button type="button" aria-label={`Next ${PART_LABELS[part]}`} onClick={() => cycle(part, 1)}>
                    ›
                  </button>
                </div>
              </div>
            ))}

            <div className="ae-section">
              <span className="ae-label">Color</span>
              <div className="ae-colors">
                {AVATAR_FILLS.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    className={`ae-color ${draft.color === i ? "is-active" : ""}`}
                    style={{ background: c }}
                    aria-label={`Color ${i + 1}`}
                    aria-pressed={draft.color === i}
                    onClick={() => {
                      change({ ...draft, color: i });
                      audio.playColorSelect(i);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="ae-section">
              <span className="ae-label">
                Hats <em className="hand">— unlock more by leveling up</em>
              </span>
              <div className="ae-hats">
                {HATS.map((h, i) => {
                  const locked = h.level > level;
                  return (
                    <button
                      key={h.name}
                      type="button"
                      className={`ae-hat ${draft.hat === i ? "is-active" : ""} ${locked ? "is-locked" : ""}`}
                      disabled={locked}
                      title={locked ? `${h.name} — unlocks at level ${h.level}` : h.name}
                      aria-label={locked ? `${h.name}, locked until level ${h.level}` : h.name}
                      onClick={() => change({ ...draft, hat: i }, 1.3)}
                    >
                      <DoodleAvatar avatar={{ ...draft, hat: i }} size={50} />
                      {locked && <span className="ae-lock">Lv {h.level}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="avatar-editor-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              audio.playSlap();
              onSave(draft);
            }}
          >
            Looks good
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
