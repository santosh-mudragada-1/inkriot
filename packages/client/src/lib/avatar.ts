import { AVATAR_PATTERN } from "@inkriot/shared";

export interface AvatarConfig {
  body: number;
  eyes: number;
  mouth: number;
  hat: number;
  color: number;
}

export const AVATAR_FILLS = [
  "#FF5A36",
  "#FFC928",
  "#FF7EC7",
  "#2FD4A0",
  "#7B5CFF",
  "#3EA8FF",
  "#FF9A3C",
  "#A4E24B",
  "#5BD9F2",
  "#C58CFF",
  "#FFB3A1",
  "#F2E6CF",
];

export const BODY_COUNT = 6;
export const EYES_COUNT = 8;
export const MOUTH_COUNT = 8;

/** Hats are the unlockable part of an avatar — each one is earned by reaching a level. */
export const HATS: { name: string; level: number }[] = [
  { name: "No hat", level: 1 },
  { name: "Party hat", level: 1 },
  { name: "Beanie", level: 2 },
  { name: "Bow", level: 3 },
  { name: "Headphones", level: 4 },
  { name: "Propeller cap", level: 5 },
  { name: "Wizard hat", level: 7 },
  { name: "Halo", level: 9 },
  { name: "Crown", level: 12 },
  { name: "Flame hair", level: 15 },
];

const STORAGE_KEY = "inkriot:avatar";

export function encodeAvatar(a: AvatarConfig): string {
  return [a.body, a.eyes, a.mouth, a.hat, a.color].join("-");
}

export function decodeAvatar(s: string | null | undefined, fallbackSeed = ""): AvatarConfig {
  if (s && AVATAR_PATTERN.test(s)) {
    const [body, eyes, mouth, hat, color] = s.split("-").map(Number);
    return {
      body: body % BODY_COUNT,
      eyes: eyes % EYES_COUNT,
      mouth: mouth % MOUTH_COUNT,
      hat: hat % HATS.length,
      color: color % AVATAR_FILLS.length,
    };
  }
  return seededAvatar(fallbackSeed);
}

/** Deterministic avatar from any string, so players without a saved avatar still look stable. */
export function seededAvatar(seed: string): AvatarConfig {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const pick = (n: number) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    return Math.abs(h) % n;
  };
  return { body: pick(BODY_COUNT), eyes: pick(EYES_COUNT), mouth: pick(MOUTH_COUNT), hat: 0, color: pick(AVATAR_FILLS.length) };
}

export function randomAvatar(maxLevel: number): AvatarConfig {
  const r = (n: number) => Math.floor(Math.random() * n);
  const hats = HATS.map((h, i) => ({ ...h, i })).filter((h) => h.level <= maxLevel);
  return {
    body: r(BODY_COUNT),
    eyes: r(EYES_COUNT),
    mouth: r(MOUTH_COUNT),
    hat: hats[r(hats.length)].i,
    color: r(AVATAR_FILLS.length),
  };
}

export function loadAvatar(): AvatarConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && AVATAR_PATTERN.test(raw)) return decodeAvatar(raw);
  } catch {
    /* storage blocked */
  }
  const fresh = randomAvatar(1);
  saveAvatar(fresh);
  return fresh;
}

export function saveAvatar(a: AvatarConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, encodeAvatar(a));
  } catch {
    /* ignore */
  }
}
