import {
  ARTIST_SHARE_BASE,
  ARTIST_SHARE_FLOOR,
  ARTIST_SHARE_STEP,
  MAX_POINTS,
  MAX_STREAK_BONUS,
  MIN_POINTS,
  STREAK_BONUS_PER_LEVEL,
} from "./constants.js";

/** Time-scaled points for a correct guess, before streak and rounding: 100 at the buzzer, 1000 instantly. */
export function baseGuesserPoints(remainingMs: number, totalMs: number): number {
  const fraction = Math.max(0, Math.min(1, remainingMs / totalMs));
  return MIN_POINTS + (MAX_POINTS - MIN_POINTS) * fraction;
}

/** Faster correct guesses earn more points; scales linearly with time remaining. */
export function guesserPoints(remainingMs: number, totalMs: number, streak: number): number {
  const base = Math.round(baseGuesserPoints(remainingMs, totalMs));
  const streakBonus = Math.min(MAX_STREAK_BONUS, streak * STREAK_BONUS_PER_LEVEL);
  return base + streakBonus;
}

/** Share of a guesser's points the artist keeps, by how many players are in the room. */
export function artistShare(playerCount: number): number {
  return Math.max(ARTIST_SHARE_FLOOR, ARTIST_SHARE_BASE - ARTIST_SHARE_STEP * playerCount);
}

/**
 * The artist is paid for how well the drawing worked, not for drawing. Each solver
 * contributes their own (streak-free) points, weighted by how early they solved: with
 * G guessers the 1st solver counts G, the 2nd G-1 … the last 1. Someone who didn't
 * solve contributes nothing, and always sits in the lowest-weighted slots, so one slow
 * guesser barely dents a good artist while a drawing nobody gets earns exactly 0.
 *
 * `solves` is each solver's base points, in the order they solved. The weights are
 * normalised by their total, so the most an artist can earn is `artistShare × 1000`
 * however big the room is.
 */
export function artistPoints(solves: number[], guesserCount: number, playerCount: number): number {
  const guessers = Math.max(guesserCount, solves.length);
  if (guessers === 0 || solves.length === 0) return 0;
  let weighted = 0;
  solves.forEach((points, i) => {
    weighted += (guessers - i) * points;
  });
  const totalWeight = (guessers * (guessers + 1)) / 2;
  return Math.round(artistShare(playerCount) * (weighted / totalWeight));
}

export function normalizeGuess(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

/** Spacing-insensitive form, so "firefighter" matches "fire fighter" and "hot-dog" matches "hot dog". */
function compact(text: string): string {
  return normalizeGuess(text).replace(/ /g, "");
}

export function isCloseGuess(guess: string, word: string): boolean {
  const g = compact(guess);
  const w = compact(word);
  if (g === w || g.length < 3) return false;
  const distance = levenshtein(g, w);
  return distance > 0 && distance <= Math.max(1, Math.floor(w.length * 0.25));
}

export function isCorrectGuess(guess: string, word: string): boolean {
  const g = compact(guess);
  return g.length > 0 && g === compact(word);
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}
