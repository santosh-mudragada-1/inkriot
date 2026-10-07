import { C } from "./palette";
import type { Body, Item } from "./pieces";

/**
 * The cast. Positions are in stage pixels (1920×1080); `t0` is the entrance time in
 * seconds. Scene 1 writes one word to draw, then more pile on — every one a real prompt
 * from the game's word list; scene 2 is the pile-up of real InkRiot
 * pieces — guesses, word cards, avatars, tool chips — that the brush later sweeps away.
 */

// Players who show up across the film (avatar codes are body-eyes-mouth-hat-color).
export const CREW = {
  nova: { name: "Nova", avatar: "0-1-4-1-4", color: "#7B5CFF" },
  mia: { name: "Mia", avatar: "3-2-1-8-2", color: "#FF7EC7" },
  leo: { name: "Leo", avatar: "1-0-5-2-5", color: "#3EA8FF" },
  kai: { name: "Kai", avatar: "4-5-7-5-3", color: "#2FD4A0" },
  ana: { name: "Ana", avatar: "2-7-0-3-1", color: "#FF9A3C" },
};

const g = (name: keyof typeof CREW, text: string, extra: Partial<Extract<Body, { kind: "guess" }>> = {}): Body => ({
  kind: "guess",
  name: CREW[name].name,
  color: CREW[name].color,
  text,
  ...extra,
});

export const CHAOS: Item[] = [
  // ---- scene 1: one thing to draw, then another, then another
  { id: "splash", x: 960, y: 540, rot: -3, t0: 0.15, enter: "write", body: { kind: "splash", text: "rocket" } },
  { id: "prompt-cat", x: 505, y: 290, rot: -8, t0: 1.15, enter: "slam", body: { kind: "sticker", text: "cat", color: C.sun, size: 118 } },
  { id: "prompt-unicorn", x: 1440, y: 790, rot: 6, t0: 1.45, enter: "slam", body: { kind: "sticker", text: "unicorn", color: C.gum, size: 104 } },
  { id: "prompt-ghost", x: 1480, y: 250, rot: 9, t0: 1.7, enter: "write", body: { kind: "hand", text: "ghost", color: C.tomato, size: 130 } },
  { id: "prompt-volcano", x: 420, y: 830, rot: 5, t0: 1.92, enter: "slam", body: { kind: "sticker", text: "volcano", color: C.mint, size: 78 } },
  { id: "prompt-robot", x: 1150, y: 130, rot: -5, t0: 2.05, enter: "slam", body: { kind: "sticker", text: "robot", color: C.sky, size: 66 } },
  { id: "prompt-banana", x: 790, y: 930, rot: -7, t0: 2.16, enter: "write", body: { kind: "hand", text: "banana", color: C.grape, size: 100 } },
  { id: "prompt-octopus", x: 215, y: 520, rot: -10, t0: 2.26, enter: "slam", body: { kind: "sticker", text: "octopus", color: C.tomato, size: 62, stroked: true } },
  { id: "prompt-cactus", x: 1730, y: 540, rot: 12, t0: 2.34, enter: "slam", body: { kind: "sticker", text: "cactus", color: C.paper, size: 56 } },

  // ---- scene 2: the prompts multiply into a pile of real InkRiot pieces
  { id: "w-pizza", x: 290, y: 160, rot: -10, t0: 2.45, enter: "flip", body: { kind: "word", word: "pizza", diff: "easy" } },
  { id: "g-potato", x: 1290, y: 430, rot: 3, t0: 2.53, enter: "slide", body: g("leo", "a potato?") },
  { id: "d-star", x: 700, y: 200, rot: -8, t0: 2.6, enter: "pop", body: { kind: "doodle", shape: "star", color: C.sun, size: 130 } },
  { id: "a-mia", x: 1660, y: 240, rot: 8, t0: 2.67, enter: "drop", body: { kind: "avatar", avatar: CREW.mia.avatar, size: 150 } },
  { id: "arrow1", x: 1060, y: 300, rot: 18, t0: 2.74, enter: "draw", body: { kind: "arrow", color: C.tomato, length: 230 } },
  { id: "g-dog", x: 560, y: 690, rot: -4, t0: 2.81, enter: "slide", body: g("mia", "IS THAT A DOG") },
  { id: "tool-pen", x: 1790, y: 730, rot: -12, t0: 2.88, enter: "flip", body: { kind: "tool", tool: "pen" } },
  { id: "d-squig", x: 330, y: 975, rot: -6, t0: 2.94, enter: "pop", body: { kind: "doodle", shape: "squiggle", color: C.sky, size: 230 } },
  { id: "w-light", x: 1560, y: 935, rot: 7, t0: 3.0, enter: "flip", body: { kind: "word", word: "lighthouse", diff: "medium" } },
  { id: "timer", x: 120, y: 330, rot: -8, t0: 3.07, enter: "pop", body: { kind: "timer", seconds: 12 } },
  { id: "sketch", x: 830, y: 430, rot: -5, t0: 3.14, enter: "slam", body: { kind: "sketch" } },
  { id: "r-laugh", x: 1190, y: 650, rot: 10, t0: 3.2, enter: "pop", body: { kind: "reaction", emoji: "😂" } },
  { id: "d-loop", x: 1470, y: 110, rot: 12, t0: 3.26, enter: "pop", body: { kind: "doodle", shape: "loop", color: C.tomato, size: 120 } },
  { id: "g-cloud", x: 1090, y: 860, rot: -3, t0: 3.32, enter: "slide", body: g("kai", "cloud", { close: true }) },
  { id: "a-leo", x: 170, y: 730, rot: -6, t0: 3.38, enter: "drop", body: { kind: "avatar", avatar: CREW.leo.avatar, size: 140 } },
  { id: "swatches", x: 640, y: 95, rot: 4, t0: 3.44, enter: "flip", body: { kind: "swatches" } },
  { id: "scrib1", x: 1720, y: 450, rot: -8, t0: 3.5, enter: "draw", body: { kind: "scribble", color: C.grape, size: 170, seed: 4 } },
  { id: "stamp", x: 430, y: 440, rot: -9, t0: 3.56, enter: "slam", body: { kind: "stamp", headline: "NICE!", points: 640, color: C.mint } },
  { id: "hint", x: 1250, y: 215, rot: 2, t0: 3.62, enter: "pop", body: { kind: "hint" } },
  { id: "d-paint", x: 900, y: 1010, rot: -4, t0: 3.67, enter: "pop", body: { kind: "doodle", shape: "stroke", color: C.mint, size: 250 } },
  { id: "r-fire", x: 270, y: 615, rot: -8, t0: 3.72, enter: "pop", body: { kind: "reaction", emoji: "🔥" } },
  { id: "c-mia", x: 1500, y: 650, rot: -2, t0: 3.77, enter: "slam", body: { kind: "correct", name: "Mia" } },
  { id: "lbrow", x: 700, y: 830, rot: 3, t0: 3.82, enter: "slide", body: { kind: "lbrow", name: "Mia", score: 1920, avatar: CREW.mia.avatar, medal: "🥇" } },
  { id: "tape1", x: 400, y: 280, rot: -30, t0: 3.87, enter: "stick", body: { kind: "tape", color: C.gum } },
  { id: "w-map", x: 990, y: 120, rot: -5, t0: 3.92, enter: "flip", body: { kind: "word", word: "treasure map", diff: "hard" } },
  { id: "btn", x: 1830, y: 320, rot: 10, t0: 3.97, enter: "pop", body: { kind: "button", label: "Join →" } },
  { id: "d-star2", x: 1340, y: 560, rot: 14, t0: 4.02, enter: "pop", body: { kind: "doodle", shape: "star", color: C.gum, size: 90 } },
  { id: "a-kai", x: 990, y: 760, rot: 5, t0: 4.07, enter: "drop", body: { kind: "avatar", avatar: CREW.kai.avatar, size: 130 } },
  { id: "arrow2", x: 500, y: 910, rot: -160, t0: 4.12, enter: "draw", body: { kind: "arrow", color: C.grape, length: 190 } },
  { id: "r-mind", x: 1630, y: 380, rot: -6, t0: 4.16, enter: "pop", body: { kind: "reaction", emoji: "🤯" } },
  { id: "g-banana", x: 170, y: 440, rot: 5, t0: 4.2, enter: "slide", body: g("ana", "banana 🍌") },
  { id: "tool-fill", x: 860, y: 610, rot: 8, t0: 4.24, enter: "flip", body: { kind: "tool", tool: "fill" } },
  { id: "d-dot", x: 1160, y: 985, rot: 0, t0: 4.28, enter: "pop", body: { kind: "doodle", shape: "dot", color: C.gum, size: 46 } },
  { id: "scrib2", x: 1320, y: 330, rot: 6, t0: 4.32, enter: "draw", body: { kind: "scribble", color: "var(--color-ink)", size: 150, seed: 9 } },
  { id: "tape2", x: 1480, y: 575, rot: 25, t0: 4.36, enter: "stick", body: { kind: "tape", color: C.sun } },
  { id: "g-pizza", x: 760, y: 300, rot: -3, t0: 4.4, enter: "slide", body: g("nova", "pizza!!", { mine: true }) },
  { id: "d-squig2", x: 1790, y: 1000, rot: 8, t0: 4.44, enter: "pop", body: { kind: "doodle", shape: "squiggle", color: C.grape, size: 170 } },
  { id: "prompt-guitar", x: 560, y: 560, rot: 7, t0: 4.5, enter: "slam", body: { kind: "sticker", text: "guitar", color: C.sun, size: 70 } },
  { id: "d-dot2", x: 620, y: 990, rot: 0, t0: 4.54, enter: "pop", body: { kind: "doodle", shape: "dot", color: C.sky, size: 34 } },
  { id: "r-eyes", x: 1060, y: 480, rot: 6, t0: 4.58, enter: "pop", body: { kind: "reaction", emoji: "👀" } },
  { id: "prompt-snowman", x: 1380, y: 770, rot: -9, t0: 4.63, enter: "slam", body: { kind: "sticker", text: "snowman", color: C.mint, size: 64 } },
  { id: "prompt-dragon", x: 330, y: 300, rot: 11, t0: 4.68, enter: "write", body: { kind: "hand", text: "dragon", color: C.sky, size: 80 } },
  { id: "prompt-whale", x: 1640, y: 820, rot: -12, t0: 4.73, enter: "slam", body: { kind: "sticker", text: "whale", color: C.grape, size: 58, stroked: true } },
  { id: "prompt-dinosaur", x: 1180, y: 1000, rot: 6, t0: 4.78, enter: "slam", body: { kind: "sticker", text: "dinosaur", color: C.gum, size: 54 } },
  { id: "prompt-penguin", x: 760, y: 700, rot: -4, t0: 4.83, enter: "slam", body: { kind: "sticker", text: "penguin", color: C.paper, size: 60 } },

  // the question lands on top of the pile
  { id: "title", x: 960, y: 520, rot: 0, t0: 5.12, enter: "slam", body: { kind: "title" } },
];

/**
 * Scene 5: the same kinds of pieces, now filed neatly around the product on the graph
 * paper's strong 96px grid lines. World px; the camera is pulled out to ~0.44 here.
 */
const LEFT = [-864, -432];
const RIGHT = [2352, 2784];
const ROWS = [-96, 288, 672, 1056];

export const ORGANIZED: Item[] = [
  // left: the words and the crew
  { id: "o-w1", x: LEFT[0], y: ROWS[0], rot: 0, t0: 0, enter: "flip", body: { kind: "word", word: "pizza", diff: "easy" } },
  { id: "o-w2", x: LEFT[0], y: ROWS[1], rot: 0, t0: 0, enter: "flip", body: { kind: "word", word: "lighthouse", diff: "medium" } },
  { id: "o-w3", x: LEFT[0], y: ROWS[2], rot: 0, t0: 0, enter: "flip", body: { kind: "word", word: "treasure map", diff: "hard" } },
  { id: "o-w4", x: LEFT[0], y: ROWS[3], rot: 0, t0: 0, enter: "flip", body: { kind: "word", word: "rocket", diff: "easy" } },
  { id: "o-a1", x: LEFT[1], y: ROWS[0], rot: 0, t0: 0, enter: "drop", body: { kind: "avatar", avatar: CREW.mia.avatar, size: 190 } },
  { id: "o-a2", x: LEFT[1], y: ROWS[1], rot: 0, t0: 0, enter: "drop", body: { kind: "avatar", avatar: CREW.leo.avatar, size: 190 } },
  { id: "o-a3", x: LEFT[1], y: ROWS[2], rot: 0, t0: 0, enter: "drop", body: { kind: "avatar", avatar: CREW.kai.avatar, size: 190 } },
  { id: "o-a4", x: LEFT[1], y: ROWS[3], rot: 0, t0: 0, enter: "drop", body: { kind: "avatar", avatar: CREW.ana.avatar, size: 190 } },
  // right: the guesses and the scores
  { id: "o-g1", x: RIGHT[0], y: ROWS[0], rot: 0, t0: 0, enter: "slide", body: g("leo", "a potato?") },
  { id: "o-g2", x: RIGHT[0], y: ROWS[1], rot: 0, t0: 0, enter: "slide", body: g("kai", "rockett", { close: true }) },
  { id: "o-g3", x: RIGHT[0], y: ROWS[2], rot: 0, t0: 0, enter: "slam", body: { kind: "correct", name: "Mia" } },
  { id: "o-g4", x: RIGHT[0], y: ROWS[3], rot: 0, t0: 0, enter: "slam", body: { kind: "correct", name: "Leo" } },
  { id: "o-s1", x: RIGHT[1], y: ROWS[0], rot: 0, t0: 0, enter: "slam", body: { kind: "stamp", headline: "FIRST!", points: 940, color: C.sun } },
  { id: "o-s2", x: RIGHT[1], y: ROWS[1] + 40, rot: 0, t0: 0, enter: "slide", body: { kind: "lbrow", name: "Mia", score: 1920, avatar: CREW.mia.avatar, medal: "🥇" } },
  { id: "o-s3", x: RIGHT[1], y: ROWS[2], rot: 0, t0: 0, enter: "pop", body: { kind: "timer", seconds: 42 } },
  { id: "o-s4", x: RIGHT[1], y: ROWS[3], rot: 0, t0: 0, enter: "pop", body: { kind: "reaction", emoji: "🔥" } },
  // top: the doodles, in a tidy row
  { id: "o-d1", x: 96, y: -384, rot: 0, t0: 0, enter: "pop", body: { kind: "doodle", shape: "star", color: C.sun, size: 170 } },
  { id: "o-d2", x: 576, y: -384, rot: 0, t0: 0, enter: "pop", body: { kind: "doodle", shape: "squiggle", color: C.sky, size: 280 } },
  { id: "o-d3", x: 1056, y: -384, rot: 0, t0: 0, enter: "pop", body: { kind: "doodle", shape: "loop", color: C.tomato, size: 160 } },
  { id: "o-d4", x: 1440, y: -384, rot: 0, t0: 0, enter: "pop", body: { kind: "doodle", shape: "stroke", color: C.mint, size: 280 } },
  { id: "o-d5", x: 1824, y: -384, rot: 0, t0: 0, enter: "pop", body: { kind: "doodle", shape: "star", color: C.gum, size: 150 } },
  // bottom: the tools
  { id: "o-t1", x: 96, y: 1440, rot: 0, t0: 0, enter: "flip", body: { kind: "tool", tool: "pen" } },
  { id: "o-t2", x: 576, y: 1440, rot: 0, t0: 0, enter: "flip", body: { kind: "swatches" } },
  { id: "o-t3", x: 1152, y: 1440, rot: 0, t0: 0, enter: "flip", body: { kind: "tool", tool: "fill" } },
  { id: "o-t4", x: 1536, y: 1440, rot: 0, t0: 0, enter: "pop", body: { kind: "hint" } },
  { id: "o-t5", x: 1920, y: 1440, rot: 0, t0: 0, enter: "pop", body: { kind: "sketch" } },
];
