import { useEffect, useRef } from "react";
import { pointerPosition } from "../../lib/pointerPosition";
import { DoodleArrow, DoodleHand } from "./CursorArt";
import { ARROW_HOTSPOT, HAND_HOTSPOT } from "./cursorHotspots";

const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, label, [role="button"], [data-clickable]';
const TRAIL_COLORS = ["var(--color-tomato)", "var(--color-sun)", "var(--color-sky)", "var(--color-gum)"];

/**
 * A doodle arrow that turns into a pointing glove over anything clickable, squishes
 * on click, and drags a little crayon-dot trail behind it. Moved with refs + rAF so
 * pointer motion never re-renders React. Disabled on touch/coarse-pointer devices,
 * and hidden over a live drawing canvas, which shows its own tool cursor.
 */
export function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const trail = useRef(TRAIL_COLORS.map(() => ({ x: -100, y: -100 })));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;

    document.body.classList.add("has-custom-cursor");
    const root = rootRef.current;

    const onLeave = () => root?.classList.add("cursor-hidden");
    const onEnter = () => root?.classList.remove("cursor-hidden");
    const onDown = () => {
      root?.classList.remove("cursor-press");
      // restart the squish animation on every click
      void root?.offsetWidth;
      root?.classList.add("cursor-press");
    };
    const onUp = () => window.setTimeout(() => root?.classList.remove("cursor-press"), 120);

    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    const tick = () => {
      const { x, y } = pointerPosition;
      if (root) root.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      // each trail dot chases the one before it
      let lead = { x, y };
      trail.current.forEach((dot, i) => {
        dot.x += (lead.x - dot.x) * 0.35;
        dot.y += (lead.y - dot.y) * 0.35;
        const el = trailRefs.current[i];
        if (el) {
          const lag = Math.hypot(dot.x - x, dot.y - y);
          el.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0) translate(-50%, -50%) scale(${Math.min(1, lag / 30)})`;
        }
        lead = dot;
      });

      // Re-derived every frame (not just on pointermove) so a stationary mouse is still
      // correctly hidden/hovered the instant the element underneath it changes — e.g. when
      // the drawing canvas appears under an already-still cursor at round start.
      const el = document.elementFromPoint(x, y);
      const hovering = !!el?.closest(INTERACTIVE_SELECTOR);
      const inCanvas = !!el?.closest("[data-drawing-canvas]");
      root?.classList.toggle("cursor-hover", hovering);
      root?.classList.toggle("cursor-suppressed", inCanvas);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div className="doodle-cursor-layer" aria-hidden>
      {TRAIL_COLORS.map((c, i) => (
        <span
          key={c}
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
          className="cursor-trail"
          style={{ background: c, width: 9 - i * 1.5, height: 9 - i * 1.5 }}
        />
      ))}
      <div ref={rootRef} className="doodle-cursor">
        <span className="cursor-art cursor-arrow" style={{ left: -ARROW_HOTSPOT.x, top: -ARROW_HOTSPOT.y }}>
          <DoodleArrow />
        </span>
        <span className="cursor-art cursor-hand" style={{ left: -HAND_HOTSPOT.x, top: -HAND_HOTSPOT.y }}>
          <DoodleHand />
        </span>
      </div>
    </div>
  );
}
