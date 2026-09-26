/**
 * Single shared source of truth for the last known pointer position. Both the
 * global CustomCursor and the in-canvas tool cursor read from this so either one
 * can position itself correctly the instant it mounts, without waiting for a
 * fresh pointer event that may never come if the mouse is already still.
 */
export const pointerPosition = { x: -1000, y: -1000 };

if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointerPosition.x = e.clientX;
      pointerPosition.y = e.clientY;
    },
    { passive: true },
  );
}
