import { clamp, easeInCubic, rng } from "./math";

/**
 * Deterministic ink + confetti particles. Particles are never stepped frame by frame: each
 * one's position is a closed-form function of its age (exponential drag + gravity), so
 * the canvas can be painted for any timeline time, forwards, backwards or scrubbed.
 */

export type Shape = "drop" | "confetti" | "dot" | "squiggle" | "fleck";
export type Space = "world" | "screen";

export interface BurstSpec {
  t0: number;
  x: number;
  y: number;
  count: number;
  colors: string[];
  seed: number;
  /** centre direction in radians (0 = right, -π/2 = up) and total spread */
  angle?: number;
  spread?: number;
  speed?: [number, number];
  size?: [number, number];
  life?: [number, number];
  gravity?: number;
  drag?: number;
  shapes?: Shape[];
  space?: Space;
  /** extra velocity added to every particle (e.g. the brush's own motion) */
  vx?: number;
  vy?: number;
  /** particles appear over this many seconds instead of all at once */
  stagger?: number;
}

interface Particle {
  delay: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  shape: Shape;
  rot: number;
  vr: number;
  wob: number;
}

interface Burst {
  t0: number;
  x: number;
  y: number;
  g: number;
  k: number;
  space: Space;
  end: number;
  parts: Particle[];
}

export interface Swirl {
  t0: number;
  dur: number;
  cx: number;
  cy: number;
  seed: number;
  count: number;
  colors: string[];
}

export class ParticleField {
  private bursts: Burst[] = [];
  private swirls: Swirl[] = [];

  burst(spec: BurstSpec) {
    const r = rng(spec.seed);
    const {
      angle = -Math.PI / 2,
      spread = Math.PI * 2,
      speed = [300, 900],
      size = [4, 12],
      life = [0.5, 1.1],
      gravity = 1400,
      drag = 2.2,
      shapes = ["drop"],
      space = "world",
      stagger = 0,
    } = spec;
    const parts: Particle[] = [];
    let maxEnd = 0;
    for (let i = 0; i < spec.count; i++) {
      const a = angle + (r() - 0.5) * spread;
      const v = speed[0] + (speed[1] - speed[0]) * Math.pow(r(), 0.7);
      const p: Particle = {
        delay: stagger * r(),
        vx: Math.cos(a) * v + (spec.vx ?? 0),
        vy: Math.sin(a) * v + (spec.vy ?? 0),
        life: life[0] + (life[1] - life[0]) * r(),
        size: size[0] + (size[1] - size[0]) * r(),
        color: spec.colors[Math.floor(r() * spec.colors.length)],
        shape: shapes[Math.floor(r() * shapes.length)],
        rot: r() * Math.PI * 2,
        vr: (r() - 0.5) * 14,
        wob: r() * 10,
      };
      maxEnd = Math.max(maxEnd, p.delay + p.life);
      parts.push(p);
    }
    this.bursts.push({ t0: spec.t0, x: spec.x, y: spec.y, g: gravity, k: drag, space, end: spec.t0 + maxEnd, parts });
  }

  /** Ink flecks spiralling in to a point and vanishing there — the finale's gathering. */
  swirl(s: Swirl) {
    this.swirls.push(s);
  }

  /**
   * Paint every live particle at timeline time `t`. `toScreen` maps world coordinates to
   * stage pixels (the camera); screen-space bursts ignore it.
   */
  draw(ctx: CanvasRenderingContext2D, t: number, toScreen: (x: number, y: number) => [number, number], camScale: number) {
    for (const b of this.bursts) {
      if (t < b.t0 || t > b.end) continue;
      const [ox, oy] = b.space === "world" ? toScreen(b.x, b.y) : [b.x, b.y];
      const sc = b.space === "world" ? camScale : 1;
      for (const p of b.parts) {
        const a = t - b.t0 - p.delay;
        if (a <= 0 || a >= p.life) continue;
        const e = Math.exp(-b.k * a);
        const dx = (p.vx * (1 - e)) / b.k;
        const dy = (p.vy * (1 - e)) / b.k + b.g * (a / b.k - (1 - e) / (b.k * b.k));
        const cvx = p.vx * e;
        const cvy = p.vy * e + (b.g * (1 - e)) / b.k;
        const life = a / p.life;
        const alpha = life < 0.7 ? 1 : 1 - (life - 0.7) / 0.3;
        const size = p.size * sc * (1 - 0.45 * life);
        drawShape(ctx, p, ox + dx * sc, oy + dy * sc, cvx, cvy, size, alpha, a);
      }
    }

    for (const s of this.swirls) {
      if (t < s.t0 || t > s.t0 + s.dur + 0.1) continue;
      const r = rng(s.seed);
      for (let i = 0; i < s.count; i++) {
        const delay = r() * s.dur * 0.35;
        const r0 = 500 + r() * 900;
        const th0 = r() * Math.PI * 2;
        const turns = 0.55 + r() * 0.6;
        const color = s.colors[Math.floor(r() * s.colors.length)];
        const w = 3 + r() * 9;
        const u = clamp((t - s.t0 - delay) / (s.dur - delay));
        if (u <= 0 || u >= 1) continue;
        // two samples a moment apart give a motion streak, like a pen flick
        const pos = (uu: number) => {
          const rr = r0 * (1 - easeInCubic(uu));
          const th = th0 + turns * Math.PI * 2 * uu * uu;
          return [s.cx + Math.cos(th) * rr, s.cy + Math.sin(th) * rr * 0.78] as const;
        };
        const [x1, y1] = pos(u);
        const [x0, y0] = pos(Math.max(0, u - 0.06));
        ctx.globalAlpha = Math.min(1, u * 4);
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineWidth = w * (1 - u * 0.6);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
}

function drawShape(ctx: CanvasRenderingContext2D, p: Particle, x: number, y: number, vx: number, vy: number, size: number, alpha: number, age: number) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  ctx.strokeStyle = p.color;
  switch (p.shape) {
    case "drop": {
      // liquid ink: stretches along its velocity, rounds off as it slows
      const sp = Math.hypot(vx, vy);
      const stretch = 1 + Math.min(2.2, sp / 600);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(vy, vx));
      ctx.beginPath();
      ctx.ellipse(0, 0, (size * stretch) / 2, size / 2 / Math.sqrt(stretch), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case "dot":
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "confetti": {
      // the same paper flutter as lib/juice.ts: squash one axis with the spin
      ctx.save();
      ctx.translate(x + Math.sin(age * 7 + p.wob) * 4, y);
      ctx.rotate(p.rot + p.vr * age);
      ctx.scale(1, Math.abs(Math.cos(age * 9 + p.wob)) + 0.2);
      ctx.fillRect(-size / 2, -size / 3, size, size * 0.66);
      ctx.restore();
      break;
    }
    case "squiggle": {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.rot + p.vr * age * 0.5);
      ctx.lineWidth = Math.max(2, size / 4);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-size / 2, 0);
      ctx.quadraticCurveTo(-size / 4, -size / 2, 0, 0);
      ctx.quadraticCurveTo(size / 4, size / 2, size / 2, 0);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "fleck": {
      // a short crayon dash, like the cursor trail
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(vy, vx));
      ctx.lineWidth = Math.max(2, size / 3);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(size, 0);
      ctx.stroke();
      ctx.restore();
      break;
    }
  }
}
