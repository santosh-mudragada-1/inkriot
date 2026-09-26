/** Indices of actual letters in a word (spaces/punctuation excluded — they're always shown). */
export function letterIndices(word: string): number[] {
  return [...word].map((_, i) => i).filter((i) => /[a-zA-Z]/.test(word[i]));
}

/** Words shorter than this never get letter hints — one letter would give them away. */
export const MIN_HINT_LETTERS = 4;

/**
 * How many letters should be revealed at a hint stage (1 = halfway, 2 = three-quarters).
 * Deliberately stingy: stage 1 is ~15% of letters (often zero for short words), stage 2
 * ~30%, and at least two letters always stay hidden so a hint never solves the word.
 */
export function hintTargetCount(totalLetters: number, stage: 1 | 2): number {
  if (totalLetters < MIN_HINT_LETTERS) return 0;
  const raw = stage === 1 ? Math.floor(totalLetters * 0.15) : Math.max(1, Math.floor(totalLetters * 0.3));
  return Math.max(0, Math.min(totalLetters - 2, raw));
}

/**
 * Picks which hidden letters to reveal next. Prefers letters that aren't the first
 * letter of a word (those make guesses far too easy) and spreads reveals across the
 * words of a phrase instead of clustering them.
 */
export function chooseHintIndices(word: string, revealed: ReadonlySet<number>, need: number): number[] {
  if (need <= 0) return [];
  const wordOf: number[] = [];
  let w = 0;
  [...word].forEach((ch, i) => {
    if (ch === " ") w++;
    wordOf[i] = w;
  });
  const isInitial = (i: number) => i === 0 || word[i - 1] === " ";
  const perWord = new Map<number, number>();
  for (const i of revealed) perWord.set(wordOf[i], (perWord.get(wordOf[i]) ?? 0) + 1);

  const hidden = letterIndices(word).filter((i) => !revealed.has(i));
  const picked: number[] = [];
  while (picked.length < need && hidden.length > 0) {
    // score: fewer reveals in that word first, non-initial letters first, then random
    hidden.sort((a, b) => {
      const byWord = (perWord.get(wordOf[a]) ?? 0) - (perWord.get(wordOf[b]) ?? 0);
      if (byWord) return byWord;
      const byInitial = Number(isInitial(a)) - Number(isInitial(b));
      if (byInitial) return byInitial;
      return Math.random() - 0.5;
    });
    const next = hidden.shift()!;
    picked.push(next);
    perWord.set(wordOf[next], (perWord.get(wordOf[next]) ?? 0) + 1);
  }
  return picked;
}

/** Renders a word as an array of characters, with unrevealed letters masked as null. Spaces and punctuation always show. */
export function buildHintPattern(word: string, revealedIndices: ReadonlySet<number>): (string | null)[] {
  return [...word].map((ch, i) => (!/[a-zA-Z]/.test(ch) ? ch : revealedIndices.has(i) ? ch : null));
}

/** Letter count of each word in a phrase — "fire fighter" -> [4, 7]. Works on hint patterns too. */
export function wordLengths(chars: string | readonly (string | null)[]): number[] {
  const lengths: number[] = [];
  let current = 0;
  for (const ch of chars) {
    if (ch === " ") {
      if (current) lengths.push(current);
      current = 0;
    } else if (ch === null || /[a-zA-Z]/.test(ch)) {
      current++;
    }
  }
  if (current) lengths.push(current);
  return lengths;
}
