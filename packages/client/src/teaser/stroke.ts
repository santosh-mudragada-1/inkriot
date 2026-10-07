import { noise1 } from "./math";

export interface Pt {
  x: number;
  y: number;
}

/**
 * A smooth centreline (Catmull-Rom through control points), densely sampled so it can be
 * walked by arc length. Used for the big brush sweeps and for anything that follows them.
 */
export class Track {
  readonly pts: Pt[] = [];
  readonly cum: number[] = [];
  readonly length: number;

  constructor(control: Pt[], samplesPerSeg = 28) {
    const c = [control[0], ...control, control[control.length - 1]];
    for (let i = 1; i < c.length - 2; i++) {
      const [p0, p1, p2, p3] = [c[i - 1], c[i], c[i + 1], c[i + 2]];
      for (let j = 0; j < samplesPerSeg; j++) {
        const t = j / samplesPerSeg;
        const t2 = t * t;
        const t3 = t2 * t;
        this.pts.push({
          x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        });
      }
    }
    this.pts.push(control[control.length - 1]);
    let acc = 0;
    this.cum.push(0);
    for (let i = 1; i < this.pts.length; i++) {
      acc += Math.hypot(this.pts[i].x - this.pts[i - 1].x, this.pts[i].y - this.pts[i - 1].y);
      this.cum.push(acc);
    }
    this.length = acc;
  }

  /** Point + unit tangent at arc length `s` (clamped). */
  at(s: number): { x: number; y: number; tx: number; ty: number } {
    const L = Math.max(0, Math.min(this.length, s));
    let lo = 0;
    let hi = this.cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] < L) lo = mid;
      else hi = mid;
    }
    const a = this.pts[lo];
    const b = this.pts[hi];
    const segLen = this.cum[hi] - this.cum[lo] || 1;
    const f = (L - this.cum[lo]) / segLen;
    const tx = (b.x - a.x) / segLen;
    const ty = (b.y - a.y) / segLen;
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, tx, ty };
  }

  /** Closest arc length on the track to `p`, and the distance to it. */
  nearest(p: Pt): { s: number; d: number } {
    let best = Infinity;
    let bestI = 0;
    for (let i = 0; i < this.pts.length; i++) {
      const d = (this.pts[i].x - p.x) ** 2 + (this.pts[i].y - p.y) ** 2;
      if (d < best) {
        best = d;
        bestI = i;
      }
    }
    return { s: this.cum[bestI], d: Math.sqrt(best) };
  }
}

const f1 = (n: number) => n.toFixed(1);

/**
 * The outline of a brush stroke laid from arc length s0 to s1 as a closed polygon path.
 * Half-width comes from `hw(s)`; the edges are roughened with two octaves of noise so
 * the paint reads as a dry, bristly brush rather than a vector line. Every polygon is
 * wound the same way, so several can be unioned in one nonzero clip-path.
 */
export function ribbon(track: Track, s0: number, s1: number, hw: (s: number) => number, seed: number, jag = 0.09, step = 12): string {
  if (s1 - s0 < 2) return "";
  const left: string[] = [];
  const right: string[] = [];
  const n = Math.max(2, Math.ceil((s1 - s0) / step));
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    const p = track.at(s);
    const w = hw(s);
    const jl = 1 + jag * (noise1(s / 38, seed) + 0.5 * noise1(s / 9, seed + 7));
    const jr = 1 + jag * (noise1(s / 38, seed + 3) + 0.5 * noise1(s / 9, seed + 11));
    // normal = tangent rotated 90°
    left.push(`${f1(p.x - p.ty * w * jl)} ${f1(p.y + p.tx * w * jl)}`);
    right.push(`${f1(p.x + p.ty * w * jr)} ${f1(p.y - p.tx * w * jr)}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}

/** A single bristle streak: a polyline offset from the centreline by `offset` × half-width. */
export function bristle(track: Track, s0: number, s1: number, hw: (s: number) => number, offset: number, seed: number, step = 16): string {
  if (s1 - s0 < 2) return "";
  const pts: string[] = [];
  const n = Math.max(2, Math.ceil((s1 - s0) / step));
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    const p = track.at(s);
    const o = hw(s) * (offset + 0.04 * noise1(s / 60, seed));
    pts.push(`${f1(p.x - p.ty * o)} ${f1(p.y + p.tx * o)}`);
  }
  return `M${pts.join("L")}`;
}
