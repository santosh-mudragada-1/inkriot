import type { DrawOp, DrawTool } from "@inkriot/shared";
import { easeInOutCubic, noise1, span } from "./math";
import { Track, type Pt } from "./stroke";

/**
 * The drawing the artist makes in the product scene, expressed as the same DrawOps the
 * real game sends over the wire. They're replayed through the real CanvasEngine, so the
 * line quality, smoothing, stroke scaling and flood fill are exactly the product's.
 */

export interface TimedOp {
  t: number;
  op: DrawOp;
}

export interface PenSample {
  t: number;
  /** canvas-local CSS px */
  x: number;
  y: number;
}

export interface RocketPlan {
  ops: TimedOp[];
  /** every pen position while a stroke is down, in time order */
  pen: PenSample[];
  /** canvas-local px of the fill click */
  fillPoint: Pt;
}

// Rocket in its own units (nose up, ~500 tall); mapped onto the canvas below.
const BODY: Pt[] = [
  { x: -70, y: 140 },
  { x: -78, y: 40 },
  { x: -74, y: -60 },
  { x: -55, y: -150 },
  { x: -25, y: -215 },
  { x: 0, y: -245 },
  { x: 25, y: -215 },
  { x: 55, y: -150 },
  { x: 74, y: -60 },
  { x: 78, y: 40 },
  { x: 70, y: 140 },
  { x: 35, y: 150 },
  { x: 0, y: 153 },
  { x: -35, y: 150 },
  { x: -70, y: 140 },
];
const FIN_L: Pt[] = [
  { x: -76, y: 30 },
  { x: -128, y: 100 },
  { x: -150, y: 186 },
  { x: -110, y: 170 },
  { x: -70, y: 140 },
];
const FIN_R: Pt[] = FIN_L.map((p) => ({ x: -p.x, y: p.y }));
const WINDOW: Pt[] = Array.from({ length: 15 }, (_, i) => {
  const a = -Math.PI / 2 + (i / 14) * Math.PI * 2.08;
  return { x: Math.cos(a) * 34, y: -58 + Math.sin(a) * 34 };
});
const FLAME: Pt[] = [
  { x: -44, y: 150 },
  { x: -36, y: 222 },
  { x: -14, y: 196 },
  { x: 0, y: 292 },
  { x: 14, y: 196 },
  { x: 36, y: 222 },
  { x: 44, y: 150 },
];
const FLAME_INNER: Pt[] = [
  { x: -16, y: 168 },
  { x: -4, y: 232 },
  { x: 6, y: 200 },
  { x: 16, y: 168 },
];

export interface RocketTimes {
  body: [number, number];
  finL: [number, number];
  finR: [number, number];
  window: [number, number];
  flame: [number, number];
  flameInner: [number, number];
  fill: number;
}

export const INK_HEX = "#1B1340";
export const SUN_HEX = "#FFC928";
export const TOMATO_HEX = "#FF5A36";

export function planRocket(w: number, h: number, times: RocketTimes): RocketPlan {
  const scale = (Math.min(w, h) * 0.56) / 500;
  const angle = (32 * Math.PI) / 180; // leaning into flight
  const cx = w * 0.5;
  const cy = h * 0.5;
  const toCanvas = (p: Pt): Pt => {
    const x = p.x * scale;
    const y = p.y * scale;
    return { x: cx + x * Math.cos(angle) - y * Math.sin(angle), y: cy + x * Math.sin(angle) + y * Math.cos(angle) };
  };

  const ops: TimedOp[] = [];
  const pen: PenSample[] = [];
  let id = 0;

  const stroke = (local: Pt[], [t0, t1]: [number, number], color: string, size: number, tool: DrawTool = "pencil", wobble = 3) => {
    const strokeId = `teaser-${id++}`;
    const track = new Track(local, 16);
    const n = Math.max(8, Math.round(track.length / 11));
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = track.at(track.length * u);
      // A steady hand isn't perfectly steady. The wobble fades out at both ends so closed
      // shapes (the body) really close — the flood fill depends on it.
      const wob = wobble * Math.sin(Math.PI * u);
      const c = toCanvas({ x: p.x + noise1(u * 9, id) * wob, y: p.y + noise1(u * 9, id + 50) * wob });
      // pens start slow, whip through the middle, and slow into the end
      const t = t0 + (t1 - t0) * easeInOutCubic(u);
      const point = { x: c.x / w, y: c.y / h };
      if (i === 0) ops.push({ t, op: { type: "start", strokeId, tool, color, size, point } });
      else ops.push({ t, op: { type: "point", strokeId, point } });
      pen.push({ t, x: c.x, y: c.y });
    }
    ops.push({ t: t1 + 0.001, op: { type: "end", strokeId } });
  };

  stroke(BODY, times.body, INK_HEX, 9);
  stroke(FIN_L, times.finL, INK_HEX, 9);
  stroke(FIN_R, times.finR, INK_HEX, 9);
  stroke(WINDOW, times.window, INK_HEX, 9, "pencil", 1.5);
  stroke(FLAME, times.flame, SUN_HEX, 9);
  stroke(FLAME_INNER, times.flameInner, SUN_HEX, 9);

  const fillPoint = toCanvas({ x: 4, y: 70 });
  ops.push({ t: times.fill, op: { type: "fill", color: TOMATO_HEX, point: { x: fillPoint.x / w, y: fillPoint.y / h } } });
  ops.sort((a, b) => a.t - b.t);
  return { ops, pen, fillPoint };
}

/** Where the pen tip is at time t while drawing (null between strokes). */
export function penAt(pen: PenSample[], t: number): PenSample | null {
  if (!pen.length || t < pen[0].t) return null;
  let lo = 0;
  let hi = pen.length - 1;
  if (t >= pen[hi].t) return pen[hi];
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (pen[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = pen[lo];
  const b = pen[hi];
  const f = span(t, a.t, b.t);
  return { t, x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}
