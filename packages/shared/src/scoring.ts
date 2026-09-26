import { ARTIST_POINTS_PER_GUESSER, MAX_POINTS, MAX_STREAK_BONUS, MIN_POINTS, STREAK_BONUS_PER_LEVEL } from "./constants.js";

/** Faster correct guesses earn more points; scales linearly with time remaining. */
export function guesserPoints(remainingMs: number, totalMs: number, streak: number): number {
  const fraction = Math.max(0, Math.min(1, remainingMs / totalMs));
  const base = Math.round(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * fraction);
  const streakBonus = Math.min(MAX_STREAK_BONUS, streak * STREAK_BONUS_PER_LEVEL);
  return base + streakBonus;
}

export function artistPoints(correctGuesserCount: number): number {
  return correctGuesserCount * ARTIST_POINTS_PER_GUESSER;
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
