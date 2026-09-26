import { useEffect } from "react";
import { motion } from "framer-motion";
import type { DrawTool } from "@inkriot/shared";
import { BRUSH_SIZES, PALETTE, useToolStore } from "../../store/useToolStore";
import { audio } from "../../lib/audio/AudioManager";
import { IconEraserTool, IconPaintBucketTool, IconPenTool, IconTrashTool, IconUndoTool } from "../icons/ToolIcons";
import "./Toolbar.css";

const TOOLS: { id: DrawTool; label: string; key: string; accent: string; Icon: typeof IconPenTool }[] = [
  { id: "pencil", label: "Pen", key: "B", accent: "var(--color-tomato)", Icon: IconPenTool },
  { id: "eraser", label: "Eraser", key: "E", accent: "var(--color-sky)", Icon: IconEraserTool },
  { id: "fill", label: "Fill", key: "F", accent: "var(--color-gum)", Icon: IconPaintBucketTool },
];

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

export function Toolbar({ onUndo, onClear }: { onUndo: () => void; onClear: () => void }) {
  const { tool, color, size, setTool, setColor, setSize } = useToolStore();

  // Keyboard shortcuts for artists: B/E/F tools, 1-4 sizes, [ ] to step size, Ctrl/Cmd+Z undo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "z") {
        e.preventDefault();
        onUndo();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = TOOLS.find((x) => x.key.toLowerCase() === k);
      if (t) {
        setTool(t.id);
        audio.playToolSelect();
        return;
      }
      const n = Number(k);
      if (n >= 1 && n <= BRUSH_SIZES.length) {
        setSize(BRUSH_SIZES[n - 1]);
        audio.playPop(0.8 + n * 0.15);
        return;
      }
      if (k === "[" || k === "]") {
        const i = BRUSH_SIZES.indexOf(size as (typeof BRUSH_SIZES)[number]);
        const next = BRUSH_SIZES[Math.max(0, Math.min(BRUSH_SIZES.length - 1, i + (k === "]" ? 1 : -1)))];
        setSize(next);
        audio.playPop(0.8 + BRUSH_SIZES.indexOf(next) * 0.15);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onUndo, setTool, setSize, size]);

  return (
    <motion.div
      className="toolbar"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <div className="toolbar-group toolbar-tools">
        {TOOLS.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            className={`tool-chip ${tool === t.id ? "active" : ""}`}
            style={{ ["--tool-accent" as string]: t.accent }}
            aria-label={`${t.label} (${t.key})`}
            aria-pressed={tool === t.id}
            title={`${t.label} — ${t.key}`}
            whileHover={{ y: -3, rotate: -4 }}
            whileTap={{ scale: 0.88, rotate: 0 }}
            onClick={() => {
              setTool(t.id);
              audio.playToolSelect();
            }}
          >
            <span className="tool-chip-icon">
              <t.Icon />
            </span>
            <span className="tool-chip-label">{t.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group toolbar-sizes" role="radiogroup" aria-label="Brush size">
        {BRUSH_SIZES.map((s, i) => (
          <motion.button
            key={s}
            type="button"
            role="radio"
            aria-checked={size === s}
            aria-label={`Brush size ${i + 1}`}
            title={`Size ${i + 1} — press ${i + 1}`}
            className={`size-chip ${size === s ? "active" : ""}`}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              setSize(s);
              audio.playPop(0.8 + i * 0.15);
            }}
          >
            <span className="size-dot" style={{ width: 4 + i * 5, height: 4 + i * 5, background: tool === "eraser" ? "var(--color-ink-faint)" : color === "#FFFFFF" ? "var(--color-ink-faint)" : color }} />
          </motion.button>
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group toolbar-palette">
        {PALETTE.map((c, i) => (
          <motion.button
            key={c}
            type="button"
            className={`swatch ${color === c ? "active" : ""}`}
            style={{ background: c }}
            aria-label={`Color ${c}`}
            aria-pressed={color === c}
            whileHover={{ scale: 1.25, rotate: -8, zIndex: 2 }}
            whileTap={{ scale: 0.8 }}
            onClick={() => {
              setColor(c);
              audio.playColorSelect(i);
            }}
          />
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group toolbar-actions">
        <motion.button
          type="button"
          className="tool-chip is-action"
          style={{ ["--tool-accent" as string]: "var(--color-sun)" }}
          whileHover={{ rotate: -25 }}
          whileTap={{ scale: 0.85 }}
          onClick={onUndo}
          aria-label="Undo (Ctrl+Z)"
          title="Undo — Ctrl/⌘ Z"
        >
          <span className="tool-chip-icon">
            <IconUndoTool />
          </span>
        </motion.button>
        <motion.button
          type="button"
          className="tool-chip is-action is-danger"
          style={{ ["--tool-accent" as string]: "var(--color-danger)" }}
          whileHover={{ rotate: 12 }}
          whileTap={{ scale: 0.85 }}
          onClick={onClear}
          aria-label="Clear canvas"
          title="Clear everything"
        >
          <span className="tool-chip-icon">
            <IconTrashTool />
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
