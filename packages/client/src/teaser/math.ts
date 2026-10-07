/**
 * Deterministic helpers for the teaser. Nothing here reads the clock or Math.random —
 * every frame of the film is a pure function of its timeline time.
 */

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0→1 progress of `t` through [a, b], clamped. */
export const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeInQuad = (t: number) => t * t;

/** mulberry32 — tiny, fast, seedable. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth 1D value noise in [-1, 1]; same (x, seed) always gives the same value. */
export function noise1(x: number, seed = 0) {
  const hash = (n: number) => {
    const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const i = Math.floor(x);
  const f = x - i;
  return lerp(hash(i), hash(i + 1), smooth(f));
}

/**
 * A real damped-spring response normalised to a unit duration, for use as a GSAP ease.
 * `zeta` is the damping ratio (lower = bouncier). The natural frequency is chosen so the
 * envelope has decayed to ~0.1% at t = 1, so the tween's duration is its settle time.
 */
export function spring(zeta = 0.4) {
  const w = 6.9 / zeta;
  const wd = w * Math.sqrt(1 - zeta * zeta);
  const k = zeta / Math.sqrt(1 - zeta * zeta);
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + k * Math.sin(wd * t));
  };
}

/** Named springs, matched by feel to the product's framer-motion springs. */
export const SPRING = {
  /** stiffness ~600 / damping ~18 — the logo letters and headline stickers */
  slam: spring(0.36),
  /** stiffness ~380 / damping ~13 — the combo stamp */
  stamp: spring(0.3),
  /** stiffness ~300 / damping ~20 — word cards, softer */
  card: spring(0.5),
  /** jelly wobble for landings */
  jelly: spring(0.22),
  /** settles almost without overshoot */
  soft: spring(0.72),
};

/**
 * Damped oscillation that starts at 1 and rings down — for squash/stretch residue and
 * camera impulses. Returns 0 before `t0`.
 */
export function ring(t: number, t0: number, freq = 9, decay = 7) {
  const d = t - t0;
  if (d < 0) return 0;
  return Math.exp(-decay * d) * Math.cos(d * freq * Math.PI * 2);
}
