import { create } from "zustand";

/**
 * Local-only player progression: XP/levels, a daily play streak, lifetime stats and
 * achievements. Everything lives in localStorage so there's no account to create —
 * the payoff for coming back is visible the moment the landing page loads.
 */

export interface Stats {
  gamesPlayed: number;
  wins: number;
  podiums: number;
  correctGuesses: number;
  firstGuesses: number;
  fastestGuessMs: number | null;
  bestStreak: number;
  drawingsGuessed: number;
  perfectDrawings: number;
  totalPoints: number;
  biggestParty: number;
}

export interface Progress {
  xp: number;
  stats: Stats;
  achievements: Record<string, number>; // id -> unlocked timestamp
  streakDays: number;
  lastPlayedDay: string | null;
  lastXpBonusDay: string | null;
}

export interface AchievementDef {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  test: (p: Progress) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_guess", emoji: "🎯", title: "Bullseye", desc: "Guess your first word", test: (p) => p.stats.correctGuesses >= 1 },
  { id: "first_in", emoji: "⚡", title: "First!", desc: "Be the first to guess a word", test: (p) => p.stats.firstGuesses >= 1 },
  { id: "speedy", emoji: "🏎️", title: "Lightning Hands", desc: "Guess a word in under 5 seconds", test: (p) => (p.stats.fastestGuessMs ?? Infinity) < 5000 },
  { id: "streak3", emoji: "🔥", title: "On Fire", desc: "Guess 3 words in a row", test: (p) => p.stats.bestStreak >= 3 },
  { id: "streak6", emoji: "☄️", title: "Unstoppable", desc: "Guess 6 words in a row", test: (p) => p.stats.bestStreak >= 6 },
  { id: "crowd", emoji: "🖼️", title: "Crowd Pleaser", desc: "Everyone guesses your drawing", test: (p) => p.stats.perfectDrawings >= 1 },
  { id: "artist10", emoji: "🎨", title: "Gallery Ready", desc: "Get 10 of your drawings guessed", test: (p) => p.stats.drawingsGuessed >= 10 },
  { id: "winner", emoji: "🏆", title: "Champion", desc: "Win a game", test: (p) => p.stats.wins >= 1 },
  { id: "wins5", emoji: "👑", title: "Dynasty", desc: "Win 5 games", test: (p) => p.stats.wins >= 5 },
  { id: "podium5", emoji: "🥉", title: "Podium Regular", desc: "Finish top 3 five times", test: (p) => p.stats.podiums >= 5 },
  { id: "games10", emoji: "🎟️", title: "Regular", desc: "Play 10 games", test: (p) => p.stats.gamesPlayed >= 10 },
  { id: "games50", emoji: "🖋️", title: "Ink Addict", desc: "Play 50 games", test: (p) => p.stats.gamesPlayed >= 50 },
  { id: "party", emoji: "🎉", title: "Party Animal", desc: "Play with 6 or more people", test: (p) => p.stats.biggestParty >= 6 },
  { id: "daily3", emoji: "📅", title: "Hat Trick", desc: "Play 3 days in a row", test: (p) => p.streakDays >= 3 },
  { id: "daily7", emoji: "🌈", title: "Week Warrior", desc: "Play 7 days in a row", test: (p) => p.streakDays >= 7 },
  { id: "level5", emoji: "✏️", title: "Scribbler", desc: "Reach level 5", test: (p) => levelInfo(p.xp).level >= 5 },
  { id: "level10", emoji: "🌟", title: "Doodle Star", desc: "Reach level 10", test: (p) => levelInfo(p.xp).level >= 10 },
];

const TITLES: [number, string][] = [
  [1, "Stick-Figure Rookie"],
  [3, "Crayon Cadet"],
  [5, "Scribbler"],
  [7, "Doodle Wrangler"],
  [10, "Doodle Star"],
  [13, "Sketch Wizard"],
  [16, "Ink Legend"],
  [20, "Riot Royalty"],
];

export function titleForLevel(level: number): string {
  let t = TITLES[0][1];
  for (const [lvl, name] of TITLES) if (level >= lvl) t = name;
  return t;
}

/** XP to go from `level` to `level + 1`. Gentle early curve so first sessions level up fast. */
export function xpToNext(level: number) {
  return 100 + (level - 1) * 55;
}

export function levelInfo(xp: number) {
  let level = 1;
  let rem = xp;
  while (rem >= xpToNext(level)) {
    rem -= xpToNext(level);
    level++;
  }
  return { level, into: rem, needed: xpToNext(level), title: titleForLevel(level) };
}

const KEY = "inkriot:progress";

const EMPTY: Progress = {
  xp: 0,
  stats: {
    gamesPlayed: 0,
    wins: 0,
    podiums: 0,
    correctGuesses: 0,
    firstGuesses: 0,
    fastestGuessMs: null,
    bestStreak: 0,
    drawingsGuessed: 0,
    perfectDrawings: 0,
    totalPoints: 0,
    biggestParty: 0,
  },
  achievements: {},
  streakDays: 0,
  lastPlayedDay: null,
  lastXpBonusDay: null,
};

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Progress>;
      return { ...EMPTY, ...parsed, stats: { ...EMPTY.stats, ...parsed.stats }, achievements: { ...parsed.achievements } };
    }
  } catch {
    /* corrupted or blocked — start fresh */
  }
  return structuredClone(EMPTY);
}

function persist(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export interface XpLine {
  label: string;
  xp: number;
}

export interface GameResult {
  xpGained: number;
  lines: XpLine[];
  levelBefore: number;
  levelAfter: number;
  xpBefore: number;
  xpAfter: number;
  newAchievements: AchievementDef[];
  rank: number;
}

export type ProgressEvent =
  | { kind: "achievement"; achievement: AchievementDef }
  | { kind: "level"; level: number; title: string };

/** Per-game running tally, reset when a game starts. */
interface GameTally {
  correct: number;
  firsts: number;
  drawnGuessed: number;
}

interface ProgressStore {
  progress: Progress;
  lastResult: GameResult | null;
  tally: GameTally;
  events: ProgressEvent[];

  /** A game started: counts toward today's streak. */
  beginGame: () => void;
  recordCorrect: (info: { ms: number | null; streak: number; first: boolean }) => void;
  recordDrawTurn: (info: { guessed: number; guessers: number }) => void;
  finishGame: (info: { score: number; rank: number; playerCount: number }) => void;
  consumeEvent: () => void;
}

function checkAchievements(p: Progress, push: (e: ProgressEvent) => void): AchievementDef[] {
  const unlocked: AchievementDef[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!p.achievements[a.id] && a.test(p)) {
      p.achievements[a.id] = Date.now();
      unlocked.push(a);
      push({ kind: "achievement", achievement: a });
    }
  }
  return unlocked;
}

export const useProgress = create<ProgressStore>((set, get) => {
  const mutate = (fn: (p: Progress, push: (e: ProgressEvent) => void) => void) => {
    const p = structuredClone(get().progress);
    const events: ProgressEvent[] = [];
    fn(p, (e) => events.push(e));
    persist(p);
    set((s) => ({ progress: p, events: [...s.events, ...events] }));
  };

  return {
    progress: load(),
    lastResult: null,
    tally: { correct: 0, firsts: 0, drawnGuessed: 0 },
    events: [],

    beginGame: () => {
      set({ tally: { correct: 0, firsts: 0, drawnGuessed: 0 }, lastResult: null });
      mutate((p, push) => {
        const today = dayKey();
        if (p.lastPlayedDay !== today) {
          const gap = p.lastPlayedDay ? daysBetween(p.lastPlayedDay, today) : Infinity;
          p.streakDays = gap === 1 ? p.streakDays + 1 : 1;
          p.lastPlayedDay = today;
        }
        checkAchievements(p, push);
      });
    },

    recordCorrect: ({ ms, streak, first }) => {
      set((s) => ({ tally: { ...s.tally, correct: s.tally.correct + 1, firsts: s.tally.firsts + (first ? 1 : 0) } }));
      mutate((p, push) => {
        p.stats.correctGuesses++;
        if (first) p.stats.firstGuesses++;
        if (ms !== null && (p.stats.fastestGuessMs === null || ms < p.stats.fastestGuessMs)) p.stats.fastestGuessMs = ms;
        p.stats.bestStreak = Math.max(p.stats.bestStreak, streak);
        checkAchievements(p, push);
      });
    },

    recordDrawTurn: ({ guessed, guessers }) => {
      if (guessed > 0) set((s) => ({ tally: { ...s.tally, drawnGuessed: s.tally.drawnGuessed + 1 } }));
      mutate((p, push) => {
        if (guessed > 0) p.stats.drawingsGuessed++;
        if (guessers > 0 && guessed === guessers) p.stats.perfectDrawings++;
        checkAchievements(p, push);
      });
    },

    finishGame: ({ score, rank, playerCount }) => {
      const { tally } = get();
      const before = get().progress;
      const lines: XpLine[] = [{ label: "Finished a game", xp: 40 }];
      if (score > 0) lines.push({ label: `${score} points scored`, xp: Math.round(score / 25) });
      if (tally.correct) lines.push({ label: `${tally.correct} correct guess${tally.correct > 1 ? "es" : ""}`, xp: tally.correct * 15 });
      if (tally.firsts) lines.push({ label: `First to guess ×${tally.firsts}`, xp: tally.firsts * 10 });
      if (tally.drawnGuessed) lines.push({ label: `Drawings guessed ×${tally.drawnGuessed}`, xp: tally.drawnGuessed * 20 });
      if (rank === 1 && playerCount > 1) lines.push({ label: "Winner!", xp: 75 });
      else if (rank <= 3 && playerCount > 2) lines.push({ label: "Podium finish", xp: 30 });
      let subtotal = lines.reduce((a, l) => a + l.xp, 0);
      const today = dayKey();
      if (before.lastXpBonusDay !== today) {
        lines.push({ label: "Daily double — first game today", xp: subtotal });
        subtotal *= 2;
      }
      if (before.streakDays >= 2) {
        const bonus = Math.min(50, before.streakDays * 5);
        lines.push({ label: `${before.streakDays}-day streak bonus`, xp: bonus });
        subtotal += bonus;
      }

      let newAchievements: AchievementDef[] = [];
      const levelBefore = levelInfo(before.xp).level;
      mutate((p, push) => {
        p.xp += subtotal;
        p.lastXpBonusDay = today;
        p.stats.gamesPlayed++;
        p.stats.totalPoints += score;
        p.stats.biggestParty = Math.max(p.stats.biggestParty, playerCount);
        if (rank === 1 && playerCount > 1) p.stats.wins++;
        if (rank <= 3 && playerCount > 2) p.stats.podiums++;
        const after = levelInfo(p.xp);
        if (after.level > levelBefore) push({ kind: "level", level: after.level, title: after.title });
        newAchievements = checkAchievements(p, push);
      });
      const xpAfter = get().progress.xp;
      set({
        lastResult: {
          xpGained: subtotal,
          lines,
          levelBefore,
          levelAfter: levelInfo(xpAfter).level,
          xpBefore: before.xp,
          xpAfter,
          newAchievements,
          rank,
        },
      });
    },

    consumeEvent: () => set((s) => ({ events: s.events.slice(1) })),
  };
});

/** True if the streak is still alive but today's game hasn't been played yet. */
export function streakAtRisk(p: Progress): boolean {
  if (!p.lastPlayedDay || p.streakDays < 1) return false;
  return daysBetween(p.lastPlayedDay, dayKey()) === 1;
}

/** The streak as it should display today (0 if it lapsed). */
export function liveStreak(p: Progress): number {
  if (!p.lastPlayedDay) return 0;
  return daysBetween(p.lastPlayedDay, dayKey()) <= 1 ? p.streakDays : 0;
}
