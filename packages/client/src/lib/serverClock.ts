/**
 * Phone and laptop clocks are often seconds off. Server deadlines (`phaseEndsAt`,
 * `drawStartsAt`) are in server time, so compare them against `serverNow()`, never
 * `Date.now()` — otherwise an artist whose clock runs fast starts drawing while the
 * server still thinks it's countdown, and those strokes never reach anyone.
 *
 * Each snapshot carries `serverNow`; `serverNow - Date.now()` on arrival is the true
 * offset minus network delay, so the largest recent sample is the best estimate (and
 * any error leans late, never early).
 */
const samples: number[] = [];
const MAX_SAMPLES = 8;
let offset = 0;

export function syncServerClock(serverTime: number | undefined) {
  if (typeof serverTime !== "number") return;
  samples.push(serverTime - Date.now());
  if (samples.length > MAX_SAMPLES) samples.shift();
  offset = Math.max(...samples);
}

export function serverNow(): number {
  return Date.now() + offset;
}
