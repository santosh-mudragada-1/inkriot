import { DEVICE_WORD_MEMORY } from "@inkriot/shared";

const KEY = "inkriot:seen-words";

/**
 * Prompts this device has seen, oldest first. Rooms live only in server memory, so
 * without this every new room (or a server restart) starts with a blank slate and
 * a regular group sees the same words night after night.
 */
export function loadSeenWords(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((w) => typeof w === "string").slice(-DEVICE_WORD_MEMORY) : [];
  } catch {
    return [];
  }
}

export function rememberSeenWords(words: (string | null | undefined)[]) {
  const fresh = words.filter((w): w is string => !!w);
  if (!fresh.length) return;
  const list = loadSeenWords().filter((w) => !fresh.includes(w));
  try {
    localStorage.setItem(KEY, JSON.stringify([...list, ...fresh].slice(-DEVICE_WORD_MEMORY)));
  } catch {
    /* storage disabled — the room's own memory still applies */
  }
}
