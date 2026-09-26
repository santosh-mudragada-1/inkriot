import { motion } from "framer-motion";
import "./PaperDoodles.css";

function Star({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5c.6 3.4 1.6 6 3.3 7.8 1.8 1.8 4.3 2.7 7.7 3.2-3.4.6-6 1.6-7.7 3.3-1.8 1.8-2.7 4.3-3.3 7.7-.5-3.4-1.5-6-3.2-7.7-1.8-1.8-4.4-2.7-7.8-3.3 3.4-.5 6-1.5 7.8-3.2 1.7-1.8 2.7-4.4 3.2-7.8Z" />
    </svg>
  );
}

function Squiggle({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 20" width="100%" height="100%" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
      <path d="M2 14c5-10 9-10 14 0s9 10 14 0 9-10 14 0 9 10 14 0" />
    </svg>
  );
}

function Loop({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" stroke={color} strokeWidth="3">
      <path d="M20 6c9 0 14 5.5 14 12s-6 12-14 12S6 24.5 6 18c0-4.6 3-8.5 8-10.5" strokeLinecap="round" />
    </svg>
  );
}

function PaintStroke({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 50 16" width="100%" height="100%">
      <path d="M2 9c6-6 12-8 20-7 10 1.3 18 4 26 2-5 6-13 9-23 8C15 11 8 12 2 9Z" fill={color} />
    </svg>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 10 10" width="100%" height="100%">
      <circle cx="5" cy="5" r="4.2" fill={color} />
    </svg>
  );
}

interface DoodleSpec {
  shape: "star" | "squiggle" | "loop" | "stroke" | "dot";
  color: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
  rotate: number;
  delay: number;
}

const DOODLES: DoodleSpec[] = [
  { shape: "star", color: "var(--color-yellow)", top: "4%", left: "6%", size: 30, rotate: -8, delay: 0 },
  { shape: "dot", color: "var(--color-pink)", top: "12%", left: "18%", size: 12, rotate: 0, delay: 0.1 },
  { shape: "squiggle", color: "var(--color-sky)", top: "6%", right: "10%", size: 60, rotate: -4, delay: 0.05 },
  { shape: "loop", color: "var(--color-accent)", top: "18%", right: "3%", size: 34, rotate: 10, delay: 0.15 },
  { shape: "stroke", color: "var(--color-green)", top: "88%", left: "4%", size: 56, rotate: -6, delay: 0.2 },
  { shape: "dot", color: "var(--color-sky)", top: "92%", left: "24%", size: 10, rotate: 0, delay: 0.25 },
  { shape: "star", color: "var(--color-pink)", top: "85%", right: "8%", size: 24, rotate: 12, delay: 0.12 },
  { shape: "dot", color: "var(--color-yellow)", top: "70%", right: "1%", size: 14, rotate: 0, delay: 0.3 },
];

export function PaperDoodles() {
  return (
    <div className="paper-doodles" aria-hidden>
      {DOODLES.map((d, i) => (
        <motion.div
          key={i}
          className="paper-doodle"
          style={{
            top: d.top,
            left: d.left,
            right: d.right,
            width: d.size,
            height: d.size,
            rotate: d.rotate,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: d.delay, type: "spring", stiffness: 260, damping: 18 }}
        >
          {d.shape === "star" && <Star color={d.color} />}
          {d.shape === "squiggle" && <Squiggle color={d.color} />}
          {d.shape === "loop" && <Loop color={d.color} />}
          {d.shape === "stroke" && <PaintStroke color={d.color} />}
          {d.shape === "dot" && <Dot color={d.color} />}
        </motion.div>
      ))}
    </div>
  );
}
