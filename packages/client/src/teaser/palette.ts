import { rng } from "./math";

export const INK = "#1b1340";
export const C = {
  tomato: "var(--color-tomato)",
  sun: "var(--color-sun)",
  gum: "var(--color-gum)",
  mint: "var(--color-mint)",
  grape: "var(--color-grape)",
  sky: "var(--color-sky)",
  paper: "var(--color-bg-raised)",
};
/** Raw hex for canvas work (canvas can't read CSS variables). */
export const HEX = { tomato: "#FF5A36", sun: "#FFC928", gum: "#FF7EC7", mint: "#2FD4A0", grape: "#7B5CFF", sky: "#3EA8FF", ink: "#1B1340", paper: "#FFFDF7" };

export const SPLASH_DROPS = (() => {
  const r = rng(77);
  return Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + r() * 0.4;
    const dist = 250 + r() * 120;
    return { x: Math.cos(a) * dist, y: Math.sin(a) * dist * 0.85, r: 7 + r() * 20, a };
  });
})();

/** Box width of a word set in the handwriting face (Gochi Hand) at `size` px. */
export const handWidth = (text: string, size: number) => size * (0.5 * text.length + 0.4);
/** The first word, written by the pen across the opening ink splash. */
export const SPLASH_WORD_SIZE = 190;
