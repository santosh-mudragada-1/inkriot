/**
 * Game-feel effects shared across screens: a single full-screen confetti canvas and a
 * screen shake. Both are imperative so socket handlers can fire them without React state.
 */

const COLORS = ["#FF5A36", "#FFC928", "#FF7EC7", "#2FD4A0", "#7B5CFF", "#3EA8FF"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  shape: 0 | 1 | 2; // rect, circle, squiggle
  life: number;
  maxLife: number;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

class ConfettiEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private raf: number | null = null;

  private ensure() {
    if (this.canvas) return;
    const c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    Object.assign(c.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: "9000" });
    document.body.appendChild(c);
    this.canvas = c;
    this.ctx = c.getContext("2d");
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
  }

  /** Burst from a point (viewport px). `spread` is in radians around straight up. */
  burst({ x, y, count = 60, power = 11, spread = Math.PI * 0.9, colors = COLORS }: { x: number; y: number; count?: number; power?: number; spread?: number; colors?: string[] }) {
    if (reducedMotion()) return;
    this.ensure();
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      const speed = power * (0.45 + Math.random() * 0.75);
      const maxLife = 70 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        size: 6 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: (Math.floor(Math.random() * 3) as 0 | 1 | 2),
        life: 0,
        maxLife,
      });
    }
    this.start();
  }

  /** Confetti falling from the top edge — for wins. */
  rain(count = 160) {
    if (reducedMotion()) return;
    this.ensure();
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * window.innerHeight * 0.6,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        size: 7 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: (Math.floor(Math.random() * 3) as 0 | 1 | 2),
        life: 0,
        maxLife: 260,
      });
    }
    this.start();
  }

  /** Burst centred on an element. */
  fromElement(el: Element | null, opts: { count?: number; power?: number } = {}) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    this.burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, ...opts });
  }

  /** Clear in device pixels so a stale transform or viewport size can never leave trails. */
  private clearAll() {
    const ctx = this.ctx;
    const c = this.canvas;
    if (!ctx || !c) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
  }

  private start() {
    if (this.raf === null) this.raf = requestAnimationFrame(this.tick);
  }

  private tick = () => {
    const ctx = this.ctx;
    if (!ctx || !this.canvas) return;
    this.clearAll();
    const h = window.innerHeight;
    this.particles = this.particles.filter((p) => p.life < p.maxLife && p.y < h + 40);
    for (const p of this.particles) {
      p.life++;
      p.vy += 0.28;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx + Math.sin((p.life + p.size) * 0.12) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      const fade = Math.min(1, (p.maxLife - p.life) / 25);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      if (p.shape === 0) {
        // paper flutter: scale one axis with rotation so rectangles appear to flip
        ctx.scale(1, Math.abs(Math.cos(p.life * 0.15)) + 0.2);
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      } else if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-p.size / 2, 0);
        ctx.quadraticCurveTo(-p.size / 4, -p.size / 2, 0, 0);
        ctx.quadraticCurveTo(p.size / 4, p.size / 2, p.size / 2, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (this.particles.length) {
      this.raf = requestAnimationFrame(this.tick);
    } else {
      this.raf = null;
      this.clearAll();
    }
  };
}

export const confetti = new ConfettiEngine();

/** Brief screen shake on the app root. `strength` 1 = small bump, 2 = big hit. */
export function shake(strength: 1 | 2 = 1) {
  if (reducedMotion()) return;
  const root = document.getElementById("root");
  if (!root) return;
  const cls = strength === 2 ? "shake-hard" : "shake-soft";
  root.classList.remove("shake-soft", "shake-hard");
  // force reflow so the animation restarts if it's already running
  void root.offsetWidth;
  root.classList.add(cls);
  window.setTimeout(() => root.classList.remove(cls), 450);
}
