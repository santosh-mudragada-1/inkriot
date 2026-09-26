import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconScribbleCheck, IconWobblyChevron } from "../icons/DoodleIcons";
import { audio } from "../../lib/audio/AudioManager";
import "./PlayfulSelect.css";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  disabled?: boolean;
  badge?: string;
}

interface PlayfulSelectProps<T extends string | number> {
  icon: ReactNode;
  accent: string;
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

export function PlayfulSelect<T extends string | number>({ icon, accent, label, value, options, onChange }: PlayfulSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className={`playful-select ${open ? "is-open-select" : ""}`}
      ref={rootRef}
      style={{ ["--select-accent" as string]: accent }}
    >
      <div className="playful-select-icon" aria-hidden>
        {icon}
      </div>
      <span className="playful-select-label">{label}</span>

      <div className="playful-select-control">
      <motion.button
        type="button"
        className={`playful-select-trigger ${open ? "is-open" : ""}`}
        whileHover={{ rotate: -1.2, scale: 1.03 }}
        whileTap={{ scale: 0.95, rotate: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onClick={() => {
          setOpen((o) => {
            if (!o) audio.playDropdownOpen();
            return !o;
          });
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current?.label ?? value}</span>
        <motion.span className="playful-select-chevron" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <IconWobblyChevron />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="playful-select-menu"
            role="listbox"
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
          >
            {options.map((opt) => (
              <li key={opt.value}>
                <motion.button
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  className={`playful-select-option ${opt.value === value ? "is-selected" : ""} ${opt.disabled ? "is-disabled" : ""}`}
                  disabled={opt.disabled}
                  whileHover={opt.disabled ? undefined : { x: 3 }}
                  onClick={() => {
                    if (opt.disabled) return;
                    audio.playDropdownSelect();
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.badge && <em className="playful-select-badge">{opt.badge}</em>}
                  {opt.value === value && <IconScribbleCheck className="playful-select-check" />}
                </motion.button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
