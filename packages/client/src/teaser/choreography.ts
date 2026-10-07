import gsap from "gsap";
import type { DrawTool } from "@inkriot/shared";
import { CanvasEngine } from "../lib/canvasEngine";
import { HAND_HOTSPOT, TOOL_HOTSPOT } from "../components/common/cursorHotspots";
import { CHAOS, ORGANIZED } from "./cast";
import { BOARD, FEED, FLOATERS, PICKED, TIMER_CIRC } from "./script";
import { clamp, easeInCubic, easeInOutCubic, easeInQuad, easeOutCubic, easeOutQuart, lerp, noise1, ring, span, SPRING } from "./math";
import { ParticleField } from "./particles";
import { handWidth, HEX, SPLASH_WORD_SIZE } from "./palette";
import type { Item } from "./pieces";
import { INK_HEX, penAt, planRocket, SUN_HEX, TOMATO_HEX } from "./rocket";
import { bristle, ribbon, Track } from "./stroke";

export const DURATION = 20;
export const W = 1920;
export const H = 1080;

export const SCENES = [
  { t: 0, label: "Ink" },
  { t: 2.5, label: "The pile-up" },
  { t: 6, label: "The brush" },
  { t: 9, label: "The product" },
  { t: 14, label: "Zoom out" },
  { t: 17, label: "Logo" },
];

export interface Teaser {
  tl: gsap.core.Timeline;
  render: (t: number) => void;
  destroy: () => void;
}

interface Opts {
  setTool: (tool: DrawTool, color: string) => void;
}

const CRAYONS = [HEX.tomato, HEX.sun, HEX.gum, HEX.mint, HEX.grape, HEX.sky];

/* ============================================================== the brush sweeps */

export interface Sweep {
  track: Track;
  t0: number;
  t1: number;
  hw: (s: number) => number;
  color: string;
  dir: 1 | -1;
  seed: number;
}

// Three passes of a giant brush: across the middle, back along the top, across the bottom.
export const SWEEPS: Sweep[] = (() => {
  const A = new Track([
    { x: 140, y: 560 },
    { x: 520, y: 430 },
    { x: 1000, y: 610 },
    { x: 1560, y: 470 },
    { x: 2260, y: 560 },
  ]);
  const B = new Track([
    { x: 2260, y: 190 },
    { x: 1560, y: 110 },
    { x: 960, y: 250 },
    { x: 380, y: 120 },
    { x: -340, y: 210 },
  ]);
  const Cc = new Track([
    { x: -340, y: 960 },
    { x: 420, y: 850 },
    { x: 1050, y: 990 },
    { x: 1640, y: 860 },
    { x: 2300, y: 920 },
  ]);
  return [
    { track: A, t0: 6.2, t1: 6.95, hw: () => 250, color: HEX.tomato, dir: 1, seed: 3 },
    { track: B, t0: 7.02, t1: 7.72, hw: () => 270, color: HEX.sun, dir: -1, seed: 17 },
    { track: Cc, t0: 7.78, t1: 8.48, hw: (s) => 250 + 150 * (s / Cc.length), color: HEX.grape, dir: 1, seed: 29 },
  ];
})();
export const BLEED: [number, number] = [8.34, 8.72];

/** Arc length of a sweep's brush head at time t: a quick attack, a fast middle, a soft landing. */
export function headS(sw: Sweep, t: number) {
  const u = span(t, sw.t0, sw.t1);
  return sw.track.length * (0.45 * u + 0.55 * easeInOutCubic(u));
}

/** Half-width at s while the head is at `head`: tapers in at the start and rounds off at the head. */
function hwAt(sw: Sweep, s: number, head: number, t: number) {
  const start = Math.sqrt(clamp(s / 90));
  const tip = 0.62 + 0.38 * Math.sqrt(clamp((head - s) / 120));
  const bleed = 1 + 1.3 * easeInCubic(span(t, BLEED[0], BLEED[1]));
  return sw.hw(s) * start * tip * bleed;
}

/* ============================================================== shared cue times (the soundtrack reads these too) */

/** The artist's strokes on the canvas: [start, end] seconds per stroke, then the fill click. */
export const ROCKET_TIMES = {
  body: [10.18, 10.7] as [number, number],
  finL: [10.73, 10.81] as [number, number],
  finR: [10.84, 10.92] as [number, number],
  window: [10.95, 11.04] as [number, number],
  flame: [11.26, 11.42] as [number, number],
  flameInner: [11.44, 11.52] as [number, number],
  fill: 11.9,
};
/** Glove clicks: pick the word, sun swatch, fill tool, tomato swatch, fill the rocket. */
export const CLICKS = [9.45, 11.14, 11.62, 11.74, 11.9];
/** When each player's points land on the scoreboard. */
export const GAINS: Record<string, number> = { mia: 12.02, leo: 12.22, kai: 12.4, nova: 12.58 };
/** Which brush pass picks up a piece at (x, y), and when its head reaches it (null: the bleed takes it). */
export function captureOf(p: { x: number; y: number }): { sw: number; tc: number } | null {
  for (let k = 0; k < SWEEPS.length; k++) {
    const sw = SWEEPS[k];
    const n = sw.track.nearest(p);
    if (n.d < sw.hw(n.s) * 0.95) {
      // invert headS numerically: when does the head reach n.s?
      let lo = sw.t0;
      let hi = sw.t1;
      for (let j = 0; j < 24; j++) {
        const mid = (lo + hi) / 2;
        if (headS(sw, mid) < n.s) lo = mid;
        else hi = mid;
      }
      return { sw: k, tc: hi };
    }
  }
  return null;
}
/** Scene 5: when the i-th organised piece files itself into place. */
export const orgAt = (i: number) => 14.5 + (i % 9) * 0.045 + Math.floor(i / 9) * 0.07;

/* ============================================================== build */

export function buildTeaser(root: HTMLElement, opts: Opts): Teaser {
  const q = <T extends Element = HTMLElement>(sel: string, from: ParentNode = root) => from.querySelector(sel) as T;
  const qa = <T extends Element = HTMLElement>(sel: string, from: ParentNode = root) => Array.from(from.querySelectorAll(sel)) as T[];

  const world = q("[data-layer=world]");
  const inkCanvas = q<HTMLCanvasElement>("[data-layer=ink]");
  const ink = inkCanvas.getContext("2d")!;
  const ui = q("[data-layer=ui]");
  const uiConv = q("[data-layer=uiconv]");
  const uiBob = q("[data-layer=uibob]");
  const uiFrame = q("[data-layer=uiframe]");
  const rims = qa<SVGPathElement>("[data-rim]");
  const bristleGroups = qa<SVGGElement>("[data-bristles]");
  const brushTop = q<SVGSVGElement>("[data-layer=paint-top]");
  const brush = q("[data-part=brush]");
  const brushTips = qa("[data-tip]", brush);
  const pen1 = q("[data-part=pen1]");

  const particles = new ParticleField();
  const tl = gsap.timeline({ paused: true });
  // lock the film's length regardless of where the last tween ends
  tl.set({}, {}, DURATION);

  /* ------------------------------------------------------------ camera */
  const cam = { x: 960, y: 540, s: 1.18, r: 0, follow: 0 };
  const shakes: { t: number; amp: number }[] = [];
  const shake = (t: number, amp: number) => shakes.push({ t, amp });

  let camNow = { x: 960, y: 540, s: 1, r: 0 };
  const toScreen = (x: number, y: number): [number, number] => {
    const c = Math.cos((camNow.r * Math.PI) / 180);
    const s = Math.sin((camNow.r * Math.PI) / 180);
    const dx = (x - camNow.x) * camNow.s;
    const dy = (y - camNow.y) * camNow.s;
    return [W / 2 + dx * c - dy * s, H / 2 + dx * s + dy * c];
  };

  // scene 1 → 2: start close on the paper, ease out as the ideas pile up
  tl.to(cam, { s: 1.0, duration: 2.6, ease: "power2.inOut" }, 0.1);
  tl.to(cam, { s: 1.06, r: -1.2, duration: 2.6, ease: "sine.inOut" }, 2.7);
  // the brush arrives: square the camera up so the sweep lands on the page
  tl.to(cam, { s: 1, r: 0, x: 960, y: 540, duration: 0.45, ease: "power3.out" }, 5.75);

  /* ------------------------------------------------------------ chaos items */
  interface Live {
    it: Item;
    ci: HTMLElement;
    sweep: HTMLElement;
    body: HTMLElement;
    inner: HTMLElement;
    phase: number;
    capture: { sw: number; tc: number; lag: number; spin: number } | null;
  }
  const chaos: Live[] = CHAOS.map((it, i) => {
    const ci = q(`[data-item="${it.id}"]`);
    return {
      it,
      ci,
      sweep: q(".ci-sweep", ci),
      body: q(".ci-body", ci),
      inner: q(".ci-inner", ci),
      phase: i * 1.37,
      capture: null,
    };
  });

  const squash = (el: Element, t: number, amt = 0.16, dur = 0.55) =>
    tl.fromTo(el, { scaleX: 1 + amt, scaleY: 1 - amt }, { scaleX: 1, scaleY: 1, duration: dur, ease: SPRING.jelly, immediateRender: false }, t);
  const drawPaths = (el: Element, t: number, dur = 0.4) => {
    const paths = qa("path[pathLength]", el);
    if (paths.length) tl.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur, ease: "power2.out", stagger: dur * 0.25 }, t);
  };
  const flecks = (x: number, y: number, t: number, seed: number, count = 9, colors = CRAYONS) =>
    particles.burst({ t0: t, x, y, count, colors, seed, shapes: ["fleck", "dot"], speed: [380, 900], size: [6, 13], life: [0.35, 0.6], gravity: 500, drag: 4 });

  function enter(l: Live, idx: number) {
    const { it, body, inner } = l;
    const t = it.t0;
    const dir = it.x < 960 ? -1 : 1;
    gsap.set(body, { xPercent: -50, yPercent: -50 });
    switch (it.enter) {
      case "slam":
        tl.fromTo(body, { scale: 1.8, rotation: it.rot * 4 || 16 * dir, autoAlpha: 0 }, { scale: 1, rotation: it.rot, autoAlpha: 1, duration: 0.6, ease: SPRING.slam }, t);
        squash(inner, t + 0.1, 0.15);
        flecks(it.x, it.y, t + 0.08, 100 + idx, 8);
        shake(t + 0.08, t < 2.5 ? 7 : 3);
        break;
      case "slide":
        tl.fromTo(body, { x: 280 * dir, scaleX: 1.35, scaleY: 0.8, rotation: it.rot + 10 * dir, autoAlpha: 0 }, { x: 0, scaleX: 1, scaleY: 1, rotation: it.rot, autoAlpha: 1, duration: 0.6, ease: SPRING.card }, t);
        break;
      case "pop":
        tl.fromTo(body, { scale: 0, rotation: it.rot - 80, autoAlpha: 0 }, { scale: 1, rotation: it.rot, autoAlpha: 1, duration: 0.7, ease: SPRING.jelly }, t);
        break;
      case "draw":
        tl.fromTo(body, { autoAlpha: 0, rotation: it.rot, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out" }, t);
        break;
      case "drop":
        tl.fromTo(body, { y: -460, rotation: it.rot - 25, autoAlpha: 0 }, { y: 0, rotation: it.rot, autoAlpha: 1, duration: 0.32, ease: "power2.in" }, t);
        tl.fromTo(inner, { scaleX: 1.3, scaleY: 0.68 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: SPRING.jelly, immediateRender: false }, t + 0.32);
        particles.burst({ t0: t + 0.32, x: it.x, y: it.y + 70, count: 10, colors: [HEX.ink], seed: 300 + idx, angle: -Math.PI / 2, spread: Math.PI * 0.9, speed: [200, 520], size: [4, 9], life: [0.3, 0.5], gravity: 1600 });
        shake(t + 0.32, 3);
        break;
      case "flip":
        tl.fromTo(body, { y: 80, rotationY: 90, rotation: it.rot * 2, autoAlpha: 0, transformPerspective: 800 }, { y: 0, rotationY: 0, rotation: it.rot, autoAlpha: 1, duration: 0.7, ease: SPRING.card }, t);
        break;
      case "stick":
        tl.fromTo(body, { scale: 1.5, rotation: it.rot, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.22, ease: "power3.out" }, t);
        break;
      case "write":
        tl.fromTo(body, { autoAlpha: 0, rotation: it.rot, scale: 1 }, { autoAlpha: 1, duration: 0.01 }, t);
        if (it.body.kind === "hand") tl.fromTo(qa(".hand-word", inner), { "--r": 0 }, { "--r": 1, duration: 0.34, ease: "power1.inOut" }, t);
        break;
    }
    drawPaths(inner, t + 0.04, it.body.kind === "sketch" ? 0.55 : 0.36);
  }
  chaos.forEach((l, i) => l.it.id !== "splash" && l.it.id !== "title" && enter(l, i));

  /* ---- scene 1: pen tap → dot → splash → the first word, handwritten */
  const splash = chaos.find((l) => l.it.id === "splash")!;
  gsap.set(splash.body, { xPercent: -50, yPercent: -50, rotation: splash.it.rot });
  const dot = q(".splash-dot", splash.body);
  const blob = q(".splash-blob", splash.body);
  const drops = qa(".splash-drop", splash.body);
  const splashWords = q(".hand-word", splash.body);
  tl.fromTo(splash.body, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0.14);
  tl.fromTo(dot, { scale: 0, svgOrigin: "0 0" }, { scale: 1, duration: 0.3, ease: SPRING.jelly }, 0.15);
  // anticipation: the dot swells and squeezes before it bursts
  tl.to(dot, { scaleX: 1.5, scaleY: 0.7, duration: 0.1, ease: "power2.in" }, 0.36);
  tl.to(dot, { scale: 0, duration: 0.05 }, 0.47);
  tl.fromTo(blob, { scale: 0, svgOrigin: "0 0", rotation: -25 }, { scale: 1, rotation: 0, duration: 0.8, ease: SPRING.jelly }, 0.46);
  drops.forEach((d, i) => {
    tl.fromTo(
      d,
      { x: 0, y: 0, scale: 0.2 },
      { x: Number(d.dataset.x), y: Number(d.dataset.y), scale: 1, duration: 0.42 + (i % 3) * 0.06, ease: "expo.out" },
      0.47 + (i % 4) * 0.012,
    );
  });
  particles.burst({ t0: 0.47, x: 960, y: 540, count: 46, colors: [HEX.ink], seed: 1, speed: [700, 1900], size: [6, 18], life: [0.35, 0.8], gravity: 1100, drag: 3.2 });
  shake(0.47, 11);
  tl.fromTo(splashWords, { "--r": 0 }, { "--r": 1, duration: 0.46, ease: "power1.inOut" }, 0.64);

  /* ---- the title: "Too many ideas?" */
  const title = chaos.find((l) => l.it.id === "title")!;
  gsap.set(title.body, { xPercent: -50, yPercent: -50 });
  const tm1 = q(".tm-line1", title.body);
  const tm2 = q(".tm-line2", title.body);
  tl.fromTo(title.body, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 5.12);
  tl.fromTo(tm1, { scale: 1.9, rotation: -14, autoAlpha: 0 }, { scale: 1, rotation: -3, autoAlpha: 1, duration: 0.6, ease: SPRING.slam }, 5.12);
  tl.fromTo(tm2, { scale: 2.1, rotation: 12, autoAlpha: 0 }, { scale: 1, rotation: 2, autoAlpha: 1, duration: 0.6, ease: SPRING.slam }, 5.27);
  squash(tm2, 5.36, 0.2);
  shake(5.14, 12);
  shake(5.29, 18);
  flecks(960, 560, 5.3, 999, 22);

  /* ---- sweep capture: which pass of the brush picks up each item, and when */
  chaos.forEach((l, i) => {
    const c = captureOf(l.it);
    if (!c) return;
    const sw = SWEEPS[c.sw];
    l.capture = { sw: c.sw, tc: c.tc, lag: 70 + (i % 5) * 45, spin: (i % 2 ? 1 : -1) * (90 + (i % 3) * 60) };
    particles.burst({ t0: c.tc, x: l.it.x, y: l.it.y, count: 8, colors: [sw.color, HEX.ink], seed: 500 + i, speed: [300, 900], size: [5, 14], life: [0.3, 0.6], vx: sw.dir * 500, gravity: 900 });
  });

  /* ---- brush spray: flecks thrown off the bristles all along each pass */
  SWEEPS.forEach((sw, k) => {
    for (let t = sw.t0; t < sw.t1; t += 0.028) {
      const h = sw.track.at(headS(sw, t));
      if (h.x < -100 || h.x > W + 100) continue;
      particles.burst({
        t0: t,
        x: h.x - sw.dir * 30,
        y: h.y,
        count: 3,
        colors: [sw.color, sw.color, HEX.ink],
        seed: 7000 + k * 1000 + Math.round(t * 1000),
        angle: sw.dir > 0 ? Math.PI : 0,
        spread: Math.PI * 1.3,
        speed: [250, 900],
        size: [5, 15],
        life: [0.3, 0.7],
        gravity: 1300,
        shapes: ["drop"],
      });
    }
    shake(sw.t0 + 0.05, 7);
  });
  // touchdown of the first pass
  particles.burst({ t0: 6.2, x: 150, y: 560, count: 30, colors: [HEX.tomato, HEX.ink], seed: 42, speed: [400, 1300], size: [6, 16], life: [0.4, 0.8], gravity: 1200 });

  /* ============================================================ scene 4: the product */
  // Positions in the UI's own coordinates (the UI sits at world 0,0).
  const rel = (el: HTMLElement) => {
    let x = 0;
    let y = 0;
    let n: HTMLElement | null = el;
    while (n && n !== ui) {
      x += n.offsetLeft;
      y += n.offsetTop;
      const p = n.offsetParent as HTMLElement | null;
      if (p && p !== ui) {
        x += p.clientLeft;
        y += p.clientTop;
      }
      n = p;
    }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
  };
  const part = (name: string) => q(`[data-part="${name}"]`, ui);

  const canvasEl = part("canvas") as unknown as HTMLCanvasElement;
  const cRect = rel(canvasEl);
  const engine = new CanvasEngine(canvasEl);
  engine.resize(cRect.w, cRect.h);
  const times = ROCKET_TIMES;
  const rocket = planRocket(cRect.w, cRect.h, times);
  // when the pen (or bucket) is actually pressed into the paper
  const STROKES: [number, number][] = [times.body, times.finL, times.finR, times.window, times.flame, times.flameInner, [times.fill, times.fill + 0.06]];
  let committed = 0;
  // The flood fill is pixel work (~3M px at 2× DPR) — too slow to run inside one frame.
  // Run the same engine once, offscreen, at build time, and blit its result at the
  // moment of the fill. Scrubbing backwards still replays through the live engine.
  const fillIdx = rocket.ops.findIndex((o) => o.op.type === "fill");
  const filled = document.createElement("canvas");
  const filledEngine = new CanvasEngine(filled);
  filledEngine.resize(cRect.w, cRect.h);
  filledEngine.loadHistory(rocket.ops.slice(0, fillIdx + 1).map((o) => o.op));
  const liveCtx = canvasEl.getContext("2d")!;

  const cards = qa("[data-card]", ui);
  const cardFly = qa("[data-cardfly]", ui);
  const cardRects = cardFly.map(rel);
  const picked = cards[PICKED];
  const pickedRect = cardRects[PICKED];
  const wordRect = rel(part("drawthis-word"));
  const frame = part("frame");
  const toolCursor = part("toolcursor");
  const ringEl = part("ring");
  const glove = q("[data-part=glove]", root);
  const toolbarEl = q(".toolbar", ui);
  const chips = qa(".tool-chip", toolbarEl);
  const swatches = qa(".swatch", toolbarEl);
  const fillChip = rel(chips[2]);
  const sunSwatch = rel(swatches[3]);
  const tomatoSwatch = rel(swatches[1]);
  const toUi = (p: { x: number; y: number }) => ({ x: cRect.x + p.x, y: cRect.y + p.y });
  const penFirst = (from: number) => rocket.pen.find((p) => p.t >= from)!;
  const lastPenBefore = (t: number) => [...rocket.pen].reverse().find((p) => p.t <= t)!;

  // word select overlay — the real cards flip in as the paint reveals them
  const scrim = part("scrim");
  cards.forEach((c, i) => {
    tl.fromTo(
      c,
      { opacity: 0, y: 60, rotationY: 90, rotation: (i - 1) * 8, transformPerspective: 900 },
      { opacity: 1, y: 0, rotationY: 0, rotation: (i - 1) * 4, duration: 0.7, ease: SPRING.card },
      6.45 + 0.1 + i * 0.12,
    );
  });
  tl.fromTo(part("pick-hint"), { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 6.45);
  // hover: exactly the product's whileHover lift
  tl.to(picked, { y: -12, rotation: 0, scale: 1.06, duration: 0.35, ease: SPRING.card }, 9.2);
  // click: squash + a hand-drawn ring scribbled round the choice
  tl.fromTo(picked, { scaleX: 1.16, scaleY: 0.9 }, { scaleX: 1.06, scaleY: 1.06, duration: 0.45, ease: SPRING.jelly, immediateRender: false }, 9.45);
  const pickRingWrap = q("[data-part=pickring]", root);
  Object.assign(pickRingWrap.style, {
    left: `${pickedRect.x - 34}px`,
    top: `${pickedRect.y - 44}px`,
    width: `${pickedRect.w + 68}px`,
    height: `${pickedRect.h + 70}px`,
  });
  const pickRing = q("path", pickRingWrap);
  gsap.set(pickRingWrap, { autoAlpha: 0 });
  tl.set(pickRingWrap, { autoAlpha: 1 }, 9.46);
  tl.fromTo(pickRing, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.26, ease: "power2.out" }, 9.47);
  tl.to(q("[data-part=pickring]", root), { autoAlpha: 0, duration: 0.15 }, 9.72);
  flecks(pickedRect.cx, pickedRect.cy, 9.47, 777, 12, [HEX.tomato, HEX.sun, HEX.ink]);
  // the other two tumble away
  [0, 2].forEach((i) => {
    tl.to(cards[i], { y: 260, rotation: i === 0 ? -40 : 40, rotationY: i === 0 ? -70 : 70, opacity: 0, duration: 0.45, ease: "power2.in" }, 9.58 + (i ? 0.04 : 0));
  });
  tl.to([part("pick-hint"), part("autopick")], { opacity: 0, y: -14, duration: 0.25, ease: "power2.in" }, 9.6);
  tl.to(scrim, { backgroundColor: "rgba(207, 230, 255, 0)", backdropFilter: "blur(0px)", duration: 0.35, ease: "power2.out" }, 9.7);
  tl.to(part("choosing"), { opacity: 0, scale: 0.8, duration: 0.2 }, 9.85);
  // drop: the header sticker lands with a bounce
  tl.fromTo(part("drawthis-word"), { opacity: 0 }, { opacity: 1, duration: 0.01 }, 10.04);
  tl.fromTo(part("drawthis-word"), { scaleX: 1.35, scaleY: 0.7 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: SPRING.jelly, immediateRender: false }, 10.04);
  tl.fromTo(part("drawthis-label"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 10.1);
  flecks(wordRect.cx, wordRect.cy, 10.05, 778, 14);
  shake(10.05, 5);
  // the canvas goes live and the real toolbar springs up (its own mount motion, replayed)
  tl.fromTo(part("dock"), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: SPRING.card }, 10.02);
  tl.to(frame, { keyframes: [{ scale: 1.012, duration: 0.12 }, { scale: 1, duration: 0.4, ease: SPRING.jelly }] }, 10.05);
  // the fill: the canvas thumps as the colour floods in
  tl.fromTo(frame, { scaleX: 1.018, scaleY: 0.985 }, { scaleX: 1, scaleY: 1, duration: 0.55, ease: SPRING.jelly, immediateRender: false }, 11.9);
  const fillW = toUi(rocket.fillPoint);
  particles.burst({ t0: 11.9, x: fillW.x, y: fillW.y, count: 34, colors: [HEX.tomato, HEX.tomato, HEX.sun, HEX.ink], seed: 1190, speed: [400, 1200], size: [6, 16], life: [0.4, 0.8], gravity: 1300 });
  shake(11.9, 7);

  // chat: lines arrive with the product's own entrance motion
  FEED.forEach((f) => {
    if (f.at === undefined) return;
    const el = q(`[data-line="${f.id}"]`, ui);
    if (f.correct) {
      tl.fromTo(el, { opacity: 0, scale: 1.4, rotation: -4 }, { opacity: 1, scale: 1, rotation: -1, duration: 0.5, ease: SPRING.slam }, f.at);
      const r = rel(el);
      flecks(r.cx, r.cy, f.at + 0.05, 1300 + Math.round(f.at * 10), 10, [HEX.mint, HEX.sun, HEX.ink]);
    } else {
      tl.fromTo(el, { opacity: 0, x: -16, scaleX: 1.12 }, { opacity: 1, x: 0, scaleX: 1, duration: 0.35, ease: SPRING.card }, f.at);
    }
  });

  // scoreboard: got-it chips and score popups
  const rows = BOARD.map((p) => q(`[data-row="${p.id}"]`, ui));
  const rowH = rows[1].offsetTop - rows[0].offsetTop;
  const gains = GAINS;
  BOARD.forEach((p, i) => {
    const at = gains[p.id];
    if (!at) return;
    const got = q('[data-part="got"]', rows[i]);
    if (got) tl.fromTo(got, { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.5, ease: SPRING.slam }, at);
    const pop = q('[data-part="popup"]', rows[i]);
    if (pop) {
      gsap.set(pop, { opacity: 0, y: 6, scale: 0.5 });
      tl.to(pop, { keyframes: [{ opacity: 1, y: -30, scale: 1.1, duration: 0.9, ease: "power2.out" }, { opacity: 0, duration: 0.3 }] }, at);
    }
    if (!p.artist) tl.fromTo(rows[i], { backgroundColor: "#fffdf7" }, { backgroundColor: "#c9f7e4", duration: 0.25, immediateRender: false }, at);
    tl.fromTo(rows[i], { scaleX: 1.08, scaleY: 0.9 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: SPRING.jelly, immediateRender: false }, at);
  });
  const miaFire = q('[data-part="fire"]', rows[2]);
  tl.fromTo(miaFire, { scale: 0 }, { scale: 1, duration: 0.5, ease: SPRING.slam }, 12.1);
  // floating reactions over the canvas
  qa("[data-floater]", ui).forEach((el, i) => {
    const at = FLOATERS[i].at;
    gsap.set(el, { opacity: 0, scale: 0.3, y: 0, rotation: 0 });
    tl.to(
      el,
      {
        keyframes: [
          { opacity: 1, scale: 1.25, y: -90, rotation: i % 2 ? 12 : -12, duration: 0.35, ease: "power2.out" },
          { scale: 1, y: -250, rotation: i % 2 ? -8 : 8, duration: 0.8, ease: "sine.inOut" },
          { opacity: 0, y: -320, duration: 0.3 },
        ],
      },
      at,
    );
  });
  // the combo stamp: exactly the product's spring and exit
  const stamp = part("stamp");
  tl.fromTo(stamp, { scale: 2.6, rotation: -18, opacity: 0 }, { scale: 1, rotation: -6, opacity: 1, duration: 0.75, ease: SPRING.stamp }, 12.58);
  tl.to(stamp, { scale: 0.8, opacity: 0, y: -40, duration: 0.45, ease: "power2.in" }, 13.55);
  const stampR = rel(stamp);
  particles.burst({ t0: 12.66, x: stampR.cx, y: stampR.cy, count: 80, colors: CRAYONS, seed: 1266, shapes: ["confetti", "dot", "squiggle"], speed: [500, 1500], size: [9, 17], life: [0.9, 1.5], gravity: 900, drag: 2.4, angle: -Math.PI / 2, spread: Math.PI * 1.6 });
  shake(12.66, 10);

  // camera through the product
  const canvasC = { x: cRect.x + cRect.w / 2, y: cRect.y + cRect.h / 2 };
  tl.to(cam, { x: pickedRect.cx, y: pickedRect.cy + 20, s: 1.5, r: -0.8, duration: 0.55, ease: "power3.inOut" }, 8.82);
  tl.to(cam, { x: lerp(pickedRect.cx, wordRect.cx, 0.5), y: lerp(pickedRect.cy, wordRect.cy, 0.62), s: 1.3, r: 0.6, duration: 0.5, ease: "power2.inOut" }, 9.62);
  tl.to(cam, { x: canvasC.x, y: canvasC.y - 20, s: 1.42, r: -0.5, duration: 0.5, ease: "power2.inOut" }, 10.1);
  tl.to(cam, { follow: 1, duration: 0.4 }, 10.15);
  tl.to(cam, { x: canvasC.x + 30, y: canvasC.y + 120, s: 1.2, r: 0.4, follow: 0.4, duration: 0.45, ease: "power2.inOut" }, 11.02);
  tl.to(cam, { x: 960, y: 548, s: 1.03, r: 0, follow: 0, duration: 0.6, ease: "power3.inOut" }, 11.96);
  tl.to(cam, { s: 1.09, r: -0.7, y: 540, duration: 1.45, ease: "sine.inOut" }, 12.56);

  /* ============================================================ scene 5: zoom out */
  tl.to(cam, { s: 0.44, r: 1.2, x: 960, y: 560, duration: 1.15, ease: "expo.inOut" }, 13.95);
  tl.fromTo(uiFrame, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 14.2);
  const uiRadius = { r: 0 };
  tl.to(uiRadius, { r: 44, duration: 0.5, ease: "power2.out" }, 14.2);
  qa("[data-uitape]", root).forEach((el, i) => {
    tl.fromTo(el, { scale: 1.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "power3.out" }, 14.95 + i * 0.1);
  });

  const organized = ORGANIZED.map((it, i) => {
    const ci = q(`[data-org="${it.id}"]`);
    return { it, ci, sweep: q(".ci-sweep", ci), body: q(".ci-body", ci), inner: q(".ci-inner", ci), i };
  });
  organized.forEach(({ body, inner }, i) => {
    // every piece starts where chaos would have left it — flung, spun — and files itself away
    const a = i * 2.39996;
    const at = orgAt(i);
    gsap.set(body, { xPercent: -50, yPercent: -50 });
    tl.fromTo(
      body,
      { x: Math.cos(a) * 520, y: Math.sin(a) * 420, rotation: (i % 2 ? 1 : -1) * (60 + (i % 4) * 25), scale: 0.3, autoAlpha: 0 },
      { x: 0, y: 0, rotation: 0, scale: 1.5, autoAlpha: 1, duration: 0.95, ease: SPRING.card },
      at,
    );
    squash(inner, at + 0.45, 0.12, 0.5);
  });
  const orgArrows = qa("[data-orgarrow] path", root);
  tl.fromTo(orgArrows, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out", stagger: 0.06 }, 15.3);

  /* ============================================================ scene 6: converge + logo */
  const convergers = [...organized.map((o) => o.ci)];
  convergers.forEach((el, i) => {
    const o = organized[i].it;
    const dx = 960 - o.x;
    const dy = 540 - o.y;
    const d = Math.hypot(dx, dy);
    // a breath out, then everything is pulled into the centre
    tl.to(el, { x: (-dx / d) * 40, y: (-dy / d) * 40, duration: 0.25, ease: "power2.out" }, 16.85);
    tl.to(el, { x: dx, y: dy, rotation: (i % 2 ? 1 : -1) * 220, scale: 0.05, duration: 0.5, ease: "power3.in" }, 17.1 + (i % 6) * 0.012);
    tl.set(el, { autoAlpha: 0 }, 17.64);
  });
  tl.to(qa("[data-orgarrow]", root), { autoAlpha: 0, duration: 0.2 }, 17.05);
  tl.to(uiConv, { scale: 1.035, duration: 0.25, ease: "power2.out" }, 16.85);
  tl.to(uiConv, { scale: 0, rotation: 10, duration: 0.5, ease: "power3.in" }, 17.12);
  tl.set(uiConv, { autoAlpha: 0 }, 17.64);
  tl.to(cam, { s: 0.56, r: 0, duration: 0.7, ease: "power2.in" }, 16.95);
  particles.swirl({ t0: 16.98, dur: 0.66, cx: 960, cy: 540, seed: 1700, count: 110, colors: [HEX.ink, HEX.ink, ...CRAYONS] });
  qa("[data-part=finalscribble]", root).forEach((el, i) => {
    const p = q("path", el);
    const at = 17.02 + i * 0.03;
    // only on stage for the half-second they whirl
    gsap.set(el, { autoAlpha: 0 });
    tl.set(el, { autoAlpha: 1 }, at);
    tl.set(el, { autoAlpha: 0 }, at + 0.64);
    tl.fromTo(el, { rotation: i * 120, scale: 1.3 - i * 0.15 }, { rotation: i * 120 + 200, scale: 0.15, duration: 0.62, ease: "power2.in" }, at);
    gsap.set(p, { strokeDashoffset: 1 });
    tl.to(p, { keyframes: [{ strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }, { strokeDashoffset: -1.5, duration: 0.27, ease: "power2.in" }] }, at);
  });

  // everything collapses into the dot we started with…
  const fdot = q("[data-part=finaldot]", root);
  tl.fromTo(fdot, { scale: 0, autoAlpha: 1 }, { scale: 1, duration: 0.12, ease: "back.out(3)" }, 17.58);
  tl.to(fdot, { scaleX: 1.6, scaleY: 0.6, duration: 0.08, ease: "power2.in" }, 17.68);
  tl.to(fdot, { scale: 0, duration: 0.06 }, 17.76);
  // …which bursts into the brand
  particles.burst({ t0: 17.76, x: 960, y: 470, count: 70, colors: [HEX.ink], seed: 1776, speed: [900, 2300], size: [7, 20], life: [0.35, 0.8], gravity: 900, drag: 3.4, space: "screen" });
  particles.burst({ t0: 17.8, x: 960, y: 470, count: 120, colors: CRAYONS, seed: 1780, shapes: ["confetti", "dot", "squiggle"], speed: [600, 1800], size: [10, 20], life: [1.1, 2.1], gravity: 700, drag: 2.2, space: "screen" });
  shake(17.76, 16);

  const mark = q("[data-part=mark]", root);
  tl.fromTo(mark, { scale: 0, rotation: -40, autoAlpha: 0 }, { scale: 1, rotation: -6, autoAlpha: 1, duration: 0.7, ease: SPRING.slam }, 17.78);
  tl.fromTo(q(".bm-ink", mark), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.32, ease: "power2.inOut" }, 17.9);
  tl.fromTo(q(".bm-dot", mark), { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.45, ease: SPRING.jelly }, 18.18);
  const letters = qa(".teaser-logo .logo-letter", root);
  letters.forEach((el, i) => {
    const at = 17.84 + 0.055 * i;
    tl.fromTo(el, { y: -150, scale: 1.6, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.6, ease: SPRING.slam }, at);
    tl.fromTo(el, { scaleX: 1.2, scaleY: 0.8 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: SPRING.jelly, immediateRender: false }, at + 0.14);
  });
  const tag = qa(".teaser-tagline .headline-sticker", root);
  const TILT = [-3, 2, -1.5];
  tag.forEach((el, i) => {
    tl.fromTo(el, { scale: 1.8, rotation: TILT[i] * 4, autoAlpha: 0 }, { scale: 1, rotation: TILT[i], autoAlpha: 1, duration: 0.6, ease: SPRING.slam }, 18.72 + i * 0.16);
    shake(18.78 + i * 0.16, 4);
  });

  /* ============================================================ render(t) */

  let lastTool = "";
  const shakeAt = (t: number) => {
    let x = 0;
    let y = 0;
    let r = 0;
    for (const s of shakes) {
      const d = t - s.t;
      if (d < 0 || d > 0.6) continue;
      const e = Math.exp(-9 * d) * s.amp;
      x += e * Math.sin(d * 83 + s.t * 7);
      y += e * Math.cos(d * 71 + s.t * 3);
      r += e * 0.04 * Math.sin(d * 61);
    }
    return { x, y, r };
  };

  const setT = (el: HTMLElement | SVGElement, v: string) => {
    if ((el as HTMLElement).style.transform !== v) (el as HTMLElement).style.transform = v;
  };
  const vis = (el: HTMLElement | SVGElement, on: boolean) => {
    const v = on ? "visible" : "hidden";
    if ((el as HTMLElement).style.visibility !== v) (el as HTMLElement).style.visibility = v;
  };

  const writeEase = gsap.parseEase("power1.inOut");
  function penScene1(t: number) {
    // pen flies in, taps the dot, recoils from the splash, writes, flicks away
    const half = handWidth(splash.it.body.kind === "splash" ? splash.it.body.text : "", SPLASH_WORD_SIZE) / 2;
    const writeL = 960 - half; // the handwritten word's extents
    const writeR = 960 + half;
    if (t < 0.15) {
      const u = easeOutCubic(span(t, 0, 0.15));
      return { x: lerp(1300, 960, u), y: lerp(860, 540, u), rot: lerp(30, 0, u), s: 1, on: t > 0 };
    }
    if (t < 0.47) {
      const u = easeOutCubic(span(t, 0.15, 0.36));
      const press = 1 - 0.18 * Math.max(0, ring(t, 0.15, 5, 14));
      return { x: lerp(960, 1010, u), y: lerp(540, 480, u), rot: -6 * u, s: press, on: true };
    }
    if (t < 0.64) {
      const u = easeOutCubic(span(t, 0.47, 0.64));
      return { x: lerp(1010, writeL, u) + Math.sin(u * Math.PI) * 260, y: lerp(480, 560, u) - Math.sin(u * Math.PI) * 240, rot: lerp(-6, 0, u) + Math.sin(u * Math.PI) * 50, s: 1, on: true };
    }
    if (t < 1.1) {
      // the nib rides the front of the reveal mask, so the words appear under it
      const u = span(t, 0.64, 1.1);
      const x = lerp(writeL, writeR, writeEase(clamp((t - 0.64) / 0.46)));
      return { x, y: 575 + Math.sin(u * Math.PI * 11) * 34 - 40 * Math.sin(u * Math.PI * 5.5) ** 2, rot: Math.sin(u * Math.PI * 11) * 6, s: 1, on: true };
    }
    const u = easeInCubic(span(t, 1.1, 1.38));
    return { x: lerp(writeR, 1700, u), y: lerp(560, -120, u), rot: -140 * u, s: 1 - 0.3 * u, on: t < 1.38 };
  }

  function brushPose(t: number) {
    // entrance: pop in, wind up, plunge onto the paper
    if (t < 5.8 || t > 8.5) return null;
    if (t < 6.2) {
      if (t < 6.0) {
        const u = span(t, 5.8, 6.0);
        return { x: 330, y: 250, flip: 1, tilt: lerp(-40, 0, SPRING.jelly(u)), sc: SPRING.jelly(u), sq: 0, tip: 0 };
      }
      if (t < 6.12) {
        const u = easeOutCubic(span(t, 6.0, 6.12));
        return { x: lerp(330, 250, u), y: lerp(250, 175, u), flip: 1, tilt: 22 * u, sc: 1, sq: -0.12 * u, tip: 0 };
      }
      const u = easeInQuad(span(t, 6.12, 6.2));
      return { x: lerp(250, 140, u), y: lerp(175, 560, u), flip: 1, tilt: lerp(22, -10, u), sc: 1, sq: 0.25 * u, tip: 0 };
    }
    for (let k = SWEEPS.length - 1; k >= 0; k--) {
      const sw = SWEEPS[k];
      if (t >= sw.t0 - 0.03) {
        const s = headS(sw, t);
        const p = sw.track.at(s);
        const p0 = sw.track.at(headS(sw, t - 1 / 60));
        const vx = (p.x - p0.x) * 60;
        const vy = (p.y - p0.y) * 60;
        const tilt = clamp((vy / (Math.abs(vx) + 200)) * 30 * sw.dir, -25, 25);
        const sq = clamp(Math.hypot(vx, vy) / 9000, 0, 0.3) + 0.2 * Math.max(0, ring(t, sw.t0, 4, 10));
        return { x: p.x, y: p.y, flip: sw.dir, tilt, sc: 1, sq, tip: k };
      }
    }
    return null;
  }

  function sweepTransform(l: Live, t: number) {
    const { it, capture } = l;
    // idle wobble: the pile never quite sits still, and gets twitchier as it grows
    const amp = t < 2.4 ? 0.6 : lerp(0.8, 3.2, span(t, 2.4, 5.1));
    let rot = amp * Math.sin(t * (5 + (l.phase % 3)) + l.phase);
    let dx = amp * 1.4 * noise1(t * 3 + l.phase, 3);
    let dy = amp * 1.4 * noise1(t * 3 + l.phase, 8);
    // "Too many ideas?" shoves the pile outward
    const jolt = Math.max(0, ring(t, 5.29, 2.2, 6)) * 34;
    if (jolt > 0 && it.id !== "title") {
      const ax = it.x - 960;
      const ay = it.y - 540;
      const d = Math.hypot(ax, ay) || 1;
      dx += (ax / d) * jolt;
      dy += (ay / d) * jolt;
    }
    let scale = 1;
    let stretch = 1;
    let angle = 0;
    let hidden = false;

    const bleedU = span(t, BLEED[0], BLEED[0] + 0.25);
    if (capture) {
      const sw = SWEEPS[capture.sw];
      const head = sw.track.at(headS(sw, t));
      const pre = easeInCubic(span(t, capture.tc - 0.3, capture.tc));
      const post = span(t, capture.tc, capture.tc + 0.42);
      if (pre > 0 && post === 0) {
        // leaning into the approaching brush
        const ax = head.x - it.x;
        const ay = head.y - it.y;
        dx += ax * 0.12 * pre;
        dy += ay * 0.12 * pre;
        angle = Math.atan2(ay, ax);
        stretch = 1 + 0.28 * pre;
        rot += 14 * pre * sw.dir;
      }
      if (post > 0) {
        // dragged along in the wet paint behind the head, sinking into it
        const trail = sw.track.at(Math.max(0, headS(sw, t) - capture.lag));
        const e = easeOutCubic(post);
        const startX = (head.x - it.x) * 0.12;
        const startY = (head.y - it.y) * 0.12;
        dx = lerp(startX, trail.x - it.x, e);
        dy = lerp(startY, trail.y - it.y, e);
        angle = Math.atan2(trail.ty, trail.tx);
        stretch = 1 + 0.7 * Math.sin(Math.PI * Math.min(1, post * 1.3));
        rot += capture.spin * post;
        scale = 1 - easeInQuad(post);
        hidden = post >= 1;
      }
    } else if (bleedU > 0) {
      scale = 1 - easeInCubic(bleedU);
      rot += 40 * bleedU;
      hidden = bleedU >= 1;
    }
    return { v: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${angle}rad) scale(${stretch.toFixed(3)},${(1 / Math.sqrt(stretch)).toFixed(3)}) rotate(${-angle}rad) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`, hidden };
  }

  interface PointerKey {
    t: number;
    x: number;
    y: number;
  }
  // the artist's glove, in UI coordinates (fingertip positions)
  const gloveKeys: PointerKey[] = [
    { t: 8.8, x: 1560, y: 1220 },
    { t: 9.3, x: pickedRect.cx + 18, y: pickedRect.cy + 22 },
    { t: 9.62, x: pickedRect.cx + 18, y: pickedRect.cy + 22 },
  ];
  const clicks = CLICKS;
  const flame0 = toUi(penFirst(11.26));
  const afterWindow = toUi(lastPenBefore(11.05));
  const fillPt = toUi(rocket.fillPoint);
  const bodyStart = toUi(rocket.pen[0]);
  const flight = (t: number) => {
    // the picked card flies from its slot up to the header on an arc
    const u = easeInOutCubic(span(t, 9.66, 10.04));
    const x0 = pickedRect.cx;
    const y0 = pickedRect.cy;
    const x1 = wordRect.cx;
    const y1 = wordRect.cy;
    const cx = lerp(x0, x1, 0.5) + 120;
    const cy = Math.min(y0, y1) - 60;
    const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1;
    const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1;
    return { x, y, u };
  };
  const hold = (p: { x: number; y: number }) => () => p;
  const sunP = { x: sunSwatch.cx + 4, y: sunSwatch.cy + 4 };
  const fillChipP = { x: fillChip.cx + 4, y: fillChip.cy + 6 };
  const tomatoP = { x: tomatoSwatch.cx + 4, y: tomatoSwatch.cy + 4 };
  const wordP = { x: wordRect.cx + 18, y: wordRect.cy + 22 };
  // [from, to, start, end] — glove moves between targets; "pen" segments hand over to the tool cursor
  type Seg = { a: number; b: number; mode: "glove" | "tool"; from?: () => { x: number; y: number }; to?: () => { x: number; y: number } };
  const segs: Seg[] = [
    { a: 10.04, b: 10.18, mode: "glove", from: hold(wordP), to: hold(bodyStart) },
    { a: 10.18, b: 11.04, mode: "tool" },
    { a: 11.04, b: 11.14, mode: "glove", from: hold(afterWindow), to: hold(sunP) },
    { a: 11.14, b: 11.18, mode: "glove", from: hold(sunP), to: hold(sunP) },
    { a: 11.18, b: 11.26, mode: "glove", from: hold(sunP), to: hold(flame0) },
    { a: 11.26, b: 11.52, mode: "tool" },
    { a: 11.52, b: 11.62, mode: "glove", from: () => toUi(lastPenBefore(11.53)), to: hold(fillChipP) },
    { a: 11.62, b: 11.65, mode: "glove", from: hold(fillChipP), to: hold(fillChipP) },
    { a: 11.65, b: 11.74, mode: "glove", from: hold(fillChipP), to: hold(tomatoP) },
    { a: 11.74, b: 11.77, mode: "glove", from: hold(tomatoP), to: hold(tomatoP) },
    { a: 11.77, b: 11.9, mode: "glove", from: hold(tomatoP), to: hold(fillPt) },
    { a: 11.9, b: 11.98, mode: "tool" },
    { a: 11.98, b: 12.35, mode: "glove", from: hold(fillPt), to: hold({ x: 1500, y: 1180 }) },
  ];

  function pointer(t: number): { x: number; y: number; mode: "glove" | "tool" | "none" } {
    if (t < 8.8 || t >= 12.35) return { x: 0, y: 0, mode: "none" };
    if (t < 9.62) {
      const [a, b] = t < 9.3 ? [gloveKeys[0], gloveKeys[1]] : [gloveKeys[1], gloveKeys[2]];
      const u = easeInOutCubic(span(t, a.t, b.t));
      // arc in from the lower right
      return { x: lerp(a.x, b.x, u) + Math.sin(u * Math.PI) * 90, y: lerp(a.y, b.y, u), mode: "glove" };
    }
    if (t < 10.04) {
      const f = flight(t);
      return { x: f.x + 18, y: f.y + 22, mode: "glove" };
    }
    const seg = segs.find((g) => t >= g.a && t < g.b);
    if (!seg) return { x: 0, y: 0, mode: "none" };
    if (seg.mode === "tool") {
      if (seg.a === 11.9) return { ...fillPt, mode: "tool" };
      const p = penAt(rocket.pen, t)!;
      return { ...toUi(p), mode: "tool" };
    }
    const u = easeInOutCubic(span(t, seg.a, seg.b));
    const p = seg.from!();
    const q2 = seg.to!();
    return { x: lerp(p.x, q2.x, u), y: lerp(p.y, q2.y, u) - Math.sin(u * Math.PI) * 40, mode: "glove" };
  }

  function toolAt(t: number): [DrawTool, string] {
    if (t < 11.14) return ["pencil", INK_HEX];
    if (t < 11.62) return ["pencil", SUN_HEX];
    if (t < 11.74) return ["fill", SUN_HEX];
    return ["fill", TOMATO_HEX];
  }

  const timerArc = part("timer-arc");
  const timerNum = part("timer-num");
  const timerEl = part("timer");
  const scoreEls = rows.map((r) => q('[data-part="score"]', r));
  const rankEls = rows.map((r) => q('[data-part="rank"]', r));
  const brushArtOrigin = { x: TOOL_HOTSPOT.x * 8, y: TOOL_HOTSPOT.y * 8 };
  const handOrigin = { x: HAND_HOTSPOT.x * 1.6, y: HAND_HOTSPOT.y * 1.6 };
  const orgBob = organized.map((o) => o.sweep);
  const bristlePaths = bristleGroups.map((g) => qa<SVGPathElement>("path", g));
  const orgArrowWraps = qa("[data-orgarrow]", root);

  function render(t: number) {
    /* camera */
    const sh = shakeAt(t);
    const drift = { x: noise1(t * 0.7, 1) * 6, y: noise1(t * 0.7, 2) * 5, r: noise1(t * 0.5, 3) * 0.25 };
    let fx = 0;
    let fy = 0;
    if (cam.follow > 0) {
      const p = penAt(rocket.pen, t);
      if (p && t < 11.6) {
        const w = toUi(p);
        fx = (w.x - cam.x) * 0.28 * cam.follow;
        fy = (w.y - cam.y) * 0.28 * cam.follow;
      }
    }
    camNow = { x: cam.x + fx + drift.x / cam.s, y: cam.y + fy + drift.y / cam.s, s: cam.s, r: cam.r + drift.r };
    setT(world, `translate(${(W / 2 + sh.x).toFixed(2)}px,${(H / 2 + sh.y).toFixed(2)}px) rotate(${(camNow.r + sh.r).toFixed(3)}deg) scale(${camNow.s.toFixed(4)}) translate(${(-camNow.x).toFixed(2)}px,${(-camNow.y).toFixed(2)}px)`);

    /* scene 1 pen */
    const p1 = penScene1(t);
    vis(pen1, p1.on);
    if (p1.on) setT(pen1, `translate(${(p1.x - 3 * 2.6).toFixed(1)}px,${(p1.y - 37 * 2.6).toFixed(1)}px) rotate(${p1.rot.toFixed(1)}deg) scale(${p1.s.toFixed(3)})`);

    /* chaos: wobble + sweep */
    if (t < 9) {
      for (const l of chaos) {
        const { v, hidden } = sweepTransform(l, t);
        setT(l.sweep, v);
        vis(l.ci, !hidden);
      }
    } else {
      for (const l of chaos) vis(l.ci, false);
    }

    /* paint + reveal */
    const painting = t >= 6.18 && t < 9.1;
    const ribbons: string[] = [];
    SWEEPS.forEach((sw, k) => {
      const head = t < sw.t0 ? 0 : headS(sw, Math.min(t, sw.t1));
      const hw = (s: number) => hwAt(sw, s, head, t);
      // The brush lays down solid colour; the product shows through a beat behind the
      // head (and catches up once the pass ends), so every pass reads as wet paint first.
      const lag = 420 * (1 - easeOutCubic(span(t, sw.t1, sw.t1 + 0.28)));
      const reveal = Math.max(0, head - lag);
      const rhw = (s: number) => hwAt(sw, s, reveal, t) * 0.94;
      ribbons.push(painting && reveal > 2 ? ribbon(sw.track, 0, reveal, rhw, sw.seed) : "");
      const rimHw = (s: number) => hw(s) + 30;
      rims[k].setAttribute("d", painting && head > 2 ? ribbon(sw.track, 0, head, rimHw, sw.seed + 101, 0.11) : "");
      // dry-brush streaks trail only behind the head, and dry off after the pass
      const b0 = Math.max(0, head - 700);
      bristleGroups[k].style.opacity = String(1 - span(t, sw.t1, sw.t1 + 0.35));
      bristlePaths[k].forEach((b, j) => {
        const off = [-0.97, -0.84, -0.62, 0.7, 0.88, 0.99][j];
        b.setAttribute("d", painting && head > 2 ? bristle(sw.track, b0, head, hw, off, sw.seed + j) : "");
      });
    });
    brushTop.style.opacity = String(1 - span(t, 8.55, 9.05));
    if (t < 6.18) {
      vis(ui, false);
    } else if (t < BLEED[1]) {
      vis(ui, true);
      ui.style.clipPath = `path('${ribbons.filter(Boolean).join("") || "M0 0Z"}')`;
    } else {
      vis(ui, true);
      ui.style.clipPath = uiRadius.r > 0.5 ? `inset(0 round ${uiRadius.r.toFixed(1)}px)` : "none";
    }

    /* the big brush */
    const bp = brushPose(t);
    vis(brush, !!bp);
    if (bp) {
      setT(brush, `translate(${(bp.x - brushArtOrigin.x).toFixed(1)}px,${(bp.y - brushArtOrigin.y).toFixed(1)}px) scaleX(${bp.flip}) rotate(${bp.tilt.toFixed(2)}deg) scale(${(bp.sc * (1 + bp.sq * 0.6)).toFixed(3)},${(bp.sc * (1 - bp.sq)).toFixed(3)})`);
      brushTips.forEach((el, i) => (el.style.display = i === bp.tip ? "" : "none"));
    }

    /* the product: canvas replay through the real CanvasEngine */
    let target = 0;
    while (target < rocket.ops.length && rocket.ops[target].t <= t) target++;
    if (target < committed) {
      engine.loadHistory(rocket.ops.slice(0, target).map((o) => o.op));
      committed = target;
    } else {
      for (; committed < target; committed++) {
        if (committed === fillIdx) {
          liveCtx.save();
          liveCtx.setTransform(1, 0, 0, 1, 0, 0);
          liveCtx.drawImage(filled, 0, 0);
          liveCtx.restore();
        } else {
          engine.commit(rocket.ops[committed].op);
        }
      }
    }

    /* the real tool store follows the script */
    const [tool, color] = toolAt(t);
    if (lastTool !== tool + color) {
      lastTool = tool + color;
      opts.setTool(tool, color);
    }

    /* word card flight (drag with stretch, drop with bounce) */
    const f = flight(t);
    if (t >= 9.66 && t < 10.04) {
      const dx = f.x - pickedRect.cx;
      const dy = f.y - pickedRect.cy;
      const u = f.u;
      const sc = lerp(1, 0.62, easeInOutCubic(u));
      const st = 1 + 0.35 * Math.sin(Math.PI * u);
      setT(cardFly[PICKED], `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${(-10 * Math.sin(Math.PI * u)).toFixed(2)}deg) scale(${(sc * st).toFixed(3)},${(sc / st).toFixed(3)})`);
    } else {
      setT(cardFly[PICKED], "none");
    }
    // nested inside the (possibly hidden) UI, so fade rather than toggle visibility
    cardFly[PICKED].style.opacity = t < 10.04 ? "" : "0";
    scrim.style.display = t < 10.1 ? "" : "none";

    /* pointer: glove / tool cursor, with the product's click squish */
    const ptr = pointer(t);
    let squish = 1;
    for (const c of clicks) {
      const d = t - c;
      if (d >= 0 && d < 0.26) squish = Math.min(squish, 1 - 0.28 * Math.sin((d / 0.26) * Math.PI));
    }
    const draggingCard = t >= 9.62 && t < 10.04;
    if (draggingCard) squish = 0.84;
    vis(glove, ptr.mode === "glove");
    if (ptr.mode === "glove") setT(glove, `translate(${(ptr.x - handOrigin.x).toFixed(1)}px,${(ptr.y - handOrigin.y).toFixed(1)}px) rotate(-8deg) scale(${(1.6 * squish).toFixed(3)},${(1.6 * (0.5 + squish / 2)).toFixed(3)})`);
    vis(toolCursor, ptr.mode === "tool");
    if (ptr.mode === "tool") {
      const down = STROKES.some(([a, b]) => t >= a && t <= b);
      setT(toolCursor, `translate(${(ptr.x - cRect.x).toFixed(1)}px,${(ptr.y - cRect.y).toFixed(1)}px)`);
      toolCursor.classList.toggle("pressing", down);
    }
    const ringSize = Math.max(8, (9 * cRect.w) / 800);
    ringEl.style.width = ringEl.style.height = `${ringSize}px`;

    /* canvas frame live glow */
    frame.classList.toggle("is-live", t >= 10.02 && t < 14);

    /* header timer: 80s round, ticking */
    const live = t >= 10.1;
    const remaining = live ? Math.max(0, 80 - (t - 10.1) * 2) : 80;
    const secs = Math.ceil(remaining);
    const txt = live ? String(secs) : "·";
    if (timerNum.textContent !== txt) timerNum.textContent = txt;
    const frac = remaining / 80;
    timerArc.setAttribute("stroke-dashoffset", (TIMER_CIRC * (1 - frac)).toFixed(2));
    timerArc.setAttribute("stroke", frac > 0.5 ? "var(--color-mint)" : frac > 0.2 ? "var(--color-sun)" : "var(--color-tomato)");
    setT(timerEl, live ? `scale(${(1 + 0.06 * Math.max(0, ring(t, Math.floor(t - 0.1) + 0.1, 2, 12))).toFixed(3)})` : "none");

    /* scoreboard: count-up + re-rank on springs */
    const scores = BOARD.map((p) => {
      const at = gains[p.id];
      if (!at) return p.score;
      return Math.round(p.score + p.gain * easeOutQuart(span(t, at, at + 0.7)));
    });
    BOARD.forEach((_, i) => {
      const s = String(scores[i]);
      if (scoreEls[i].textContent !== s) scoreEls[i].textContent = s;
    });
    // rank order at each gain event, then spring every row toward its slot
    const events = [0, ...Object.values(gains)].sort((a, b) => a - b);
    const orderAt = (te: number) => {
      const sc = BOARD.map((p) => p.score + (gains[p.id] && te >= gains[p.id] ? p.gain : 0));
      return BOARD.map((_, i) => i).sort((a, b) => sc[b] - sc[a] || a - b);
    };
    BOARD.forEach((_, i) => {
      let y = 0;
      let prev = orderAt(-1).indexOf(i);
      for (const ev of events.slice(1)) {
        const idx = orderAt(ev + 0.1).indexOf(i);
        y += (idx - prev) * rowH * SPRING.card(span(t, ev + 0.1, ev + 0.8));
        prev = idx;
      }
      rows[i].style.translate = `0 ${y.toFixed(1)}px`;
      const rank = orderAt(t).indexOf(i);
      const medal = scores[i] > 0 && rank < 3 ? ["🥇", "🥈", "🥉"][rank] : String(rank + 1);
      if (rankEls[i].textContent !== medal) rankEls[i].textContent = medal;
    });

    /* scene 5: everything breathes together */
    const bobAmp = 16 * easeInOutCubic(span(t, 15.0, 15.6)) * (1 - span(t, 16.8, 17.0));
    const wave = (x: number) => Math.sin(2 * Math.PI * 0.85 * (t - 15) - x * 0.0016);
    orgBob.forEach((el, i) => {
      const o = organized[i].it;
      setT(el, bobAmp > 0 ? `translateY(${(bobAmp * wave(o.x)).toFixed(1)}px) rotate(${(bobAmp * 0.1 * wave(o.x + 400)).toFixed(2)}deg)` : "none");
    });
    setT(uiBob, bobAmp > 0 ? `translateY(${(bobAmp * 1.2 * wave(960)).toFixed(1)}px) rotate(${(bobAmp * 0.05 * wave(1360)).toFixed(2)}deg)` : "none");
    orgArrowWraps.forEach((el, i) => setT(el, bobAmp > 0 ? `translateY(${(bobAmp * wave(i * 500)).toFixed(1)}px)` : "none"));

    /* ink + confetti */
    ink.setTransform(1, 0, 0, 1, 0, 0);
    ink.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    const k = inkCanvas.width / W;
    ink.setTransform(k, 0, 0, k, 0, 0);
    particles.draw(ink, t, (x, y) => {
      const [sx, sy] = toScreen(x, y);
      return [sx + sh.x, sy + sh.y];
    }, camNow.s);
  }

  tl.eventCallback("onUpdate", () => render(tl.time()));

  return {
    tl,
    render,
    destroy: () => {
      tl.kill();
    },
  };
}
