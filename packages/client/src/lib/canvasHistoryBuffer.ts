import type { DrawOp } from "@inkriot/shared";

type Listener = (ops: DrawOp[]) => void;

let pending: DrawOp[] | null = null;
let listener: Listener | null = null;

/**
 * `canvas_history` can arrive before the canvas component mounts (it's sent right after
 * the join ack). Hold it here until a canvas subscribes, or hand it over immediately.
 */
export function bufferCanvasHistory(ops: DrawOp[]) {
  if (listener) listener(ops);
  else pending = ops;
}

/** Drop any buffered history — it belonged to a room we've left. */
export function clearCanvasHistory() {
  pending = null;
}

export function subscribeCanvasHistory(fn: Listener) {
  listener = fn;
  if (pending) {
    fn(pending);
    pending = null;
  }
  return () => {
    if (listener === fn) listener = null;
  };
}
