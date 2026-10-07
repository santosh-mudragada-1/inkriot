import type { CSSProperties, ReactNode } from "react";
import { DoodleAvatar } from "../components/common/DoodleAvatar";
import { DoodleHand, ToolCursorArt } from "../components/common/CursorArt";
import { HintWord } from "../components/game/HintWord";
import { IconPaintBucketTool, IconPenTool } from "../components/icons/ToolIcons";
import { Dot, Loop, PaintStroke, Squiggle, Star } from "../components/settings/PaperDoodles";
import { PALETTE } from "../store/useToolStore";
import { noise1, rng } from "./math";
import { C, handWidth, INK, SPLASH_DROPS, SPLASH_WORD_SIZE } from "./palette";

/**
 * Every object in the film. Fragments of the product are rendered with the product's own
 * class names and components, so they are the real stickers, chips and cards — just
 * pulled out of their screens and thrown around the page.
 */

export type Enter = "slam" | "slide" | "pop" | "draw" | "drop" | "flip" | "stick" | "write";

export type Body =
  | { kind: "sticker"; text: string; color: string; size: number; stroked?: boolean }
  | { kind: "hand"; text: string; color: string; size: number }
  | { kind: "splash"; text: string }
  | { kind: "word"; word: string; diff: "easy" | "medium" | "hard" }
  | { kind: "guess"; name: string; color: string; text: string; close?: boolean; mine?: boolean }
  | { kind: "correct"; name: string }
  | { kind: "avatar"; avatar: string; size: number }
  | { kind: "doodle"; shape: "star" | "squiggle" | "loop" | "stroke" | "dot"; color: string; size: number }
  | { kind: "arrow"; color: string; length: number }
  | { kind: "scribble"; color: string; size: number; seed: number }
  | { kind: "tool"; tool: "pen" | "fill" }
  | { kind: "swatches" }
  | { kind: "timer"; seconds: number }
  | { kind: "stamp"; headline: string; points: number; color: string }
  | { kind: "reaction"; emoji: string }
  | { kind: "hint" }
  | { kind: "sketch" }
  | { kind: "lbrow"; name: string; score: number; avatar: string; medal: string }
  | { kind: "button"; label: string }
  | { kind: "tape"; color: string }
  | { kind: "title" };

export interface Item {
  id: string;
  x: number;
  y: number;
  rot: number;
  scale?: number;
  t0: number;
  enter: Enter;
  body: Body;
}

/* ------------------------------------------------------------------ doodle strokes */

/** A hand-drawn arrow in the icon set's stroke style; draws on via stroke-dashoffset. */
export function DoodleArrowStroke({ color, length }: { color: string; length: number }) {
  const L = length;
  return (
    <svg width={L + 40} height={120} viewBox={`-20 -60 ${L + 40} 120`} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="draw-svg">
      <path pathLength={1} d={`M0 10 C ${L * 0.3} -50, ${L * 0.6} 50, ${L} -4`} />
      <path pathLength={1} d={`M${L - 42} -30 L${L} -4 L${L - 36} 30`} />
    </svg>
  );
}

/** A tangled pen scribble, seeded so it's the same every render. */
export function ScribbleStroke({ color, size, seed }: { color: string; size: number; seed: number }) {
  const r = rng(seed);
  let d = "M0 0";
  let x = 0;
  for (let i = 0; i < 9; i++) {
    x += size / 9;
    const y = (r() - 0.5) * size * 0.55;
    d += ` Q ${x - size / 12} ${y * 1.8 - size * 0.18} ${x} ${y}`;
  }
  return (
    <svg width={size + 30} height={size * 0.8} viewBox={`-15 ${-size * 0.4} ${size + 30} ${size * 0.8}`} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="draw-svg">
      <path pathLength={1} d={d} />
    </svg>
  );
}

/* ------------------------------------------------------------------ ink splash */

function blobPath(seed: number, R: number, lobes = 72) {
  const pts: string[] = [];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const spike = Math.pow(Math.max(0, noise1(i * 0.9, seed + 4)), 3) * 0.7;
    const r = R * (1 + 0.13 * noise1(i / 5, seed) + 0.05 * noise1(i / 1.4, seed + 9) + spike);
    pts.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`);
  }
  // smooth closed curve through the points with quadratic midpoints
  const xy = pts.map((p) => p.split(" ").map(Number));
  let d = "";
  for (let i = 0; i < xy.length; i++) {
    const [x0, y0] = xy[i];
    const [x1, y1] = xy[(i + 1) % xy.length];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    d += i === 0 ? `M${mx} ${my}` : ` Q${x0} ${y0} ${mx} ${my}`;
  }
  const [x0, y0] = xy[0];
  const [x1, y1] = xy[1];
  return `${d} Q${x0} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}Z`;
}

/** The opening ink: a dot that blooms into a splash. Animated part-by-part in the timeline. */
export function InkSplash() {
  return (
    <svg className="splash-svg" width="900" height="760" viewBox="-450 -380 900 760" aria-hidden>
      <g className="splash-blob">
        <path d={blobPath(12, 205)} fill={INK} />
        {/* a sheen of wet ink catching the light */}
        <path d="M-120 -95 C -80 -150, 10 -168, 70 -150" stroke="#fffdf7" strokeOpacity="0.28" strokeWidth="16" strokeLinecap="round" fill="none" />
      </g>
      {SPLASH_DROPS.map((d, i) => (
        <g key={i} className="splash-drop" data-x={d.x} data-y={d.y}>
          <ellipse rx={d.r * 1.25} ry={d.r} transform={`rotate(${(d.a * 180) / Math.PI})`} fill={INK} />
        </g>
      ))}
      <circle className="splash-dot" r="16" fill={INK} />
    </svg>
  );
}

/* ------------------------------------------------------------------ words */

/**
 * A word in the handwriting face, revealed left to right behind a ragged front (a
 * clip-path driven by --r, 0→1) as if it's being written in ink.
 */
export function HandWord({ text, color, size }: { text: string; color: string; size: number }) {
  const w = handWidth(text, size);
  const h = size * 1.3;
  return (
    <svg className="hand-word" width={w} height={h} viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} aria-hidden>
      <text x="0" y={size * 0.33} textAnchor="middle" fontFamily="Gochi Hand, cursive" fontSize={size} fill={color}>
        {text}
      </text>
    </svg>
  );
}

/** A word as a die-cut sticker — the landing page's headline sticker. */
export function WordSticker({ text, color, size, stroked }: { text: string; color: string; size: number; stroked?: boolean }) {
  return (
    <span className={`headline-sticker word-sticker ${stroked ? "is-stroked" : ""}`} style={{ ["--sticker" as string]: color, fontSize: size }}>
      {text}
    </span>
  );
}

/* ------------------------------------------------------------------ a sketch on a mini canvas */

/** A doodled cat on a little white canvas-frame — a drawing mid-round. */
export function MiniSketch() {
  return (
    <div className="canvas-frame mini-sketch">
      <svg viewBox="0 0 260 190" width="260" height="190" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="draw-svg">
        <path pathLength={1} d="M78 150c-18-22-20-60 4-82l-6-38 30 22c14-6 34-6 48 0l30-22-6 38c24 22 22 60 4 82-22 22-82 22-104 0Z" fill="#FFC928" />
        <path pathLength={1} d="M104 104v6M156 104v6" strokeWidth="9" />
        <path pathLength={1} d="M120 126q10 8 20 0" />
        <path pathLength={1} d="M60 118l-40-6M62 132l-40 8M200 118l40-6M198 132l40 8" stroke="#FF5A36" strokeWidth="5" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ the brand mark */

/** The favicon (public/favicon.svg), inline so its ink stroke can draw itself on. */
export function BrandMark({ size }: { size: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect className="bm-tile" x="3" y="3" width="58" height="58" rx="18" fill="#FFC928" stroke={INK} strokeWidth="4" />
      <path
        className="bm-ink"
        pathLength={1}
        d="M18 44c-2-10 3-22 14-24 8-1.5 16 3 17 11 .8 6.5-4 12-10.5 12-4 0-7-2.5-7.5-6-.5-3 1.5-5.5 4-5.5"
        stroke={INK}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <circle className="bm-dot" cx="18" cy="45" r="5" fill="#FF5A36" stroke={INK} strokeWidth="3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ item renderer */

const REACTION_BUBBLE: CSSProperties = { fontSize: 46, padding: 10 };

export function ItemBody({ body }: { body: Body }): ReactNode {
  switch (body.kind) {
    case "sticker":
      return <WordSticker text={body.text} color={body.color} size={body.size} stroked={body.stroked} />;
    case "hand":
      return <HandWord text={body.text} color={body.color} size={body.size} />;
    case "splash":
      return (
        <div className="splash-item">
          <InkSplash />
          <HandWord text={body.text} color="#fffdf7" size={SPLASH_WORD_SIZE} />
        </div>
      );
    case "word":
      return (
        <span className={`word-card diff-${body.diff}`}>
          <span className="word-card-word">{body.word}</span>
          <span className="word-card-meta">{body.word.replace(/[^a-z]/gi, "").length} letters</span>
        </span>
      );
    case "guess":
      return (
        <div className={`guess-line ${body.mine ? "is-mine" : ""} ${body.close ? "is-close" : ""}`} style={{ ["--pc" as string]: body.color }}>
          <b className="guess-name">{body.name}</b>
          <span className="guess-text">{body.text}</span>
          {body.close && <em className="close-hint">so close!</em>}
        </div>
      );
    case "correct":
      return (
        <div className="guess-line is-correct">
          <span className="correct-check">✓</span>
          <span>
            <b>{body.name}</b> got it!
          </span>
        </div>
      );
    case "avatar":
      return <DoodleAvatar avatar={body.avatar} size={body.size} />;
    case "doodle": {
      const S = { star: Star, squiggle: Squiggle, loop: Loop, stroke: PaintStroke, dot: Dot }[body.shape];
      const h = body.shape === "squiggle" ? body.size / 3 : body.shape === "stroke" ? body.size / 3.1 : body.size;
      return (
        <div style={{ width: body.size, height: h }}>
          <S color={body.color} />
        </div>
      );
    }
    case "arrow":
      return <DoodleArrowStroke color={body.color} length={body.length} />;
    case "scribble":
      return <ScribbleStroke color={body.color} size={body.size} seed={body.seed} />;
    case "tool":
      return (
        <span className="tool-chip active" style={{ ["--tool-accent" as string]: body.tool === "pen" ? C.tomato : C.gum }}>
          <span className="tool-chip-icon">{body.tool === "pen" ? <IconPenTool /> : <IconPaintBucketTool />}</span>
          <span className="tool-chip-label">{body.tool === "pen" ? "Pen" : "Fill"}</span>
        </span>
      );
    case "swatches":
      return (
        <div className="toolbar swatch-fragment">
          <div className="toolbar-palette">
            {PALETTE.slice(0, 10).map((c, i) => (
              <span key={c} className={`swatch ${i === 1 ? "active" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </div>
      );
    case "timer": {
      const R = 24;
      const CIRC = 2 * Math.PI * R;
      const fraction = body.seconds / 80;
      return (
        <div className="rh-timer urgent">
          <svg viewBox="0 0 60 60" width="60" height="60">
            <circle cx="30" cy="30" r={R} fill="var(--color-bg-raised)" stroke="var(--color-ink)" strokeWidth="3" />
            <circle cx="30" cy="30" r={R} fill="none" stroke="var(--color-tomato)" strokeWidth="7" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - fraction)} transform="rotate(-90 30 30)" />
          </svg>
          <span className="rh-timer-num">{body.seconds}</span>
        </div>
      );
    }
    case "stamp":
      return (
        <div className="combo-stamp" style={{ ["--stamp" as string]: body.color }}>
          <span className="combo-headline">{body.headline}</span>
          <span className="combo-points">+{body.points}</span>
        </div>
      );
    case "reaction":
      return (
        <span className="lb-reaction reaction-sticker" style={REACTION_BUBBLE}>
          {body.emoji}
        </span>
      );
    case "hint":
      return (
        <div className="hint-fragment">
          <span className="rh-word-label hand">
            guess the word <b>(5)</b>
          </span>
          <HintWord pattern={["p", null, "z", null, "a"]} />
        </div>
      );
    case "sketch":
      return <MiniSketch />;
    case "lbrow":
      return (
        <div className="lb-row lb-fragment">
          <span className="lb-rank">{body.medal}</span>
          <span className="avatar-disc lb-avatar">
            <DoodleAvatar avatar={body.avatar} size={36} crop="bust" />
          </span>
          <span className="lb-name">
            <span className="lb-name-text">{body.name}</span>
            <span className="lb-badges">
              <span className="lb-chip chip-fire">🔥×3</span>
            </span>
          </span>
          <span className="lb-score">{body.score}</span>
        </div>
      );
    case "button":
      return <span className="btn btn-accent2 btn-md">{body.label}</span>;
    case "tape":
      return <span className="tape teaser-tape" style={{ ["--tape" as string]: body.color }} />;
    case "title":
      return (
        <div className="too-many">
          <span className="headline-sticker tm-line1" style={{ ["--sticker" as string]: C.paper }}>
            Too many
          </span>
          <span className="headline-sticker tm-line2 is-stroked" style={{ ["--sticker" as string]: C.tomato }}>
            ideas?
          </span>
        </div>
      );
  }
}

export { DoodleHand, ToolCursorArt };
