import { motion } from "framer-motion";
import type { DrawTool } from "@inkriot/shared";
import { PALETTE, useToolStore } from "../../store/useToolStore";
import { audio } from "../../lib/audio/AudioManager";
import { IconEraserTool, IconPaintBucketTool, IconPenTool, IconTrashTool, IconUndoTool } from "../icons/ToolIcons";
import "./Toolbar.css";

const TOOLS: { id: DrawTool; label: string; accent: string; Icon: typeof IconPenTool }[] = [
  { id: "pencil", label: "Pen", accent: "var(--color-accent)", Icon: IconPenTool },
  { id: "eraser", label: "Eraser", accent: "var(--color-sky)", Icon: IconEraserTool },
  { id: "fill", label: "Paint", accent: "var(--color-pink)", Icon: IconPaintBucketTool },
];

export function Toolbar({ onUndo, onClear }: { onUndo: () => void; onClear: () => void }) {
  const { tool, color, setTool, setColor } = useToolStore();

  return (
    <div className="toolbar">
      <div className="toolbar-group toolbar-tools">
        {TOOLS.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            className={`tool-chip ${tool === t.id ? "active" : ""}`}
            style={{ ["--tool-accent" as string]: t.accent }}
            aria-label={t.label}
            whileHover={{ y: -2, rotate: -2, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.92, rotate: 0, transition: { duration: 0.08 } }}
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

      <div className="toolbar-group toolbar-palette">
        {PALETTE.map((c) => (
          <motion.button
            key={c}
            type="button"
            className={`swatch ${color === c ? "active" : ""}`}
            style={{ background: c, borderColor: c === "#FFFFFF" ? "var(--color-line-strong)" : "var(--color-ink)" }}
            aria-label={`Color ${c}`}
            whileHover={{ scale: 1.2, rotate: -6, transition: { duration: 0.12 } }}
            whileTap={{ scale: 0.85, transition: { duration: 0.08 } }}
            onClick={() => {
              setColor(c);
              audio.playColorSelect();
            }}
          />
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group toolbar-actions">
        <motion.button
          type="button"
          className="tool-chip is-action"
          style={{ ["--tool-accent" as string]: "var(--color-yellow)" }}
          whileHover={{ rotate: -18, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.9 }}
          onClick={onUndo}
          aria-label="Undo"
        >
          <span className="tool-chip-icon">
            <IconUndoTool />
          </span>
        </motion.button>
        <motion.button
          type="button"
          className="tool-chip is-action is-danger"
          style={{ ["--tool-accent" as string]: "var(--color-danger)" }}
          whileHover={{ rotate: 8, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.9 }}
          onClick={onClear}
          aria-label="Clear canvas"
        >
          <span className="tool-chip-icon">
            <IconTrashTool />
          </span>
        </motion.button>
      </div>
    </div>
  );
}
