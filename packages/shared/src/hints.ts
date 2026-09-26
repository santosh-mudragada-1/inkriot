/** Indices of actual letters in a word (spaces excluded — they're always shown). */
export function letterIndices(word: string): number[] {
  return [...word].map((_, i) => i).filter((i) => /[a-zA-Z]/.test(word[i]));
}

/** How many letters should be revealed by a given checkpoint, always leaving at least one hidden. */
export function hintTargetCount(totalLetters: number, fraction: number): number {
  return Math.max(1, Math.min(totalLetters - 1, Math.round(totalLetters * fraction)));
}

/** Renders a word as an array of characters, with unrevealed letters masked as null. Spaces always show. */
export function buildHintPattern(word: string, revealedIndices: ReadonlySet<number>): (string | null)[] {
  return [...word].map((ch, i) => (ch === " " ? " " : revealedIndices.has(i) ? ch : null));
}
