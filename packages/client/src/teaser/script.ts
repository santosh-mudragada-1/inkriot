import { CREW } from "./cast";

/** The product scene's script: what the artist is offered, who scores, what gets typed. */

export const WORD_CHOICES = ["ghost", "rocket", "cactus"];
export const PICKED = 1;

/** Scoreboard: starting order, and what each player earns this round. */
export const BOARD: { id: string; name: string; avatar: string; color: string; score: number; gain: number; self?: boolean; artist?: boolean }[] = [
  { ...CREW.nova, id: "nova", score: 1240, gain: 360, self: true, artist: true },
  { ...CREW.leo, id: "leo", score: 1100, gain: 700 },
  { ...CREW.mia, id: "mia", score: 980, gain: 940 },
  { ...CREW.kai, id: "kai", score: 620, gain: 520 },
  { ...CREW.ana, id: "ana", score: 450, gain: 0 },
];

/** Chat, in order. `at` is when the line lands (s); lines without it are already there. */
export const FEED: { id: string; at?: number; who?: keyof typeof CREW; text?: string; close?: boolean; correct?: boolean; system?: string }[] = [
  { id: "sys", system: "Ana joined the room." },
  { id: "pre", who: "mia", text: "ready!!" },
  { id: "g1", at: 10.52, who: "leo", text: "pencil?" },
  { id: "g2", at: 10.86, who: "ana", text: "a carrot" },
  { id: "g3", at: 11.24, who: "kai", text: "missile!!" },
  { id: "g4", at: 11.58, who: "kai", text: "rockett", close: true },
  { id: "c1", at: 12.02, who: "mia", correct: true },
  { id: "c2", at: 12.22, who: "leo", correct: true },
  { id: "c3", at: 12.4, who: "kai", correct: true },
];

export const FLOATERS = [
  { emoji: "🔥", who: "mia" as const, left: 22, at: 12.1 },
  { emoji: "😂", who: "leo" as const, left: 50, at: 12.3 },
  { emoji: "👏", who: "kai" as const, left: 76, at: 12.5 },
];

export const TIMER_R = 24;
export const TIMER_CIRC = 2 * Math.PI * TIMER_R;
