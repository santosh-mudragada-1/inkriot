import { useEffect, useRef } from "react";
import { pointerPosition } from "../../lib/pointerPosition";

const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="button"], [data-clickable]';

/**
 * A single global cursor dot, moved with a ref + rAF so pointer motion never
 * triggers a React re-render. Disabled entirely on touch/coarse-pointer devices.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const ring = useRef({ x: -100, y: -100 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;

    document.body.classList.add("has-custom-cursor");

    const onLeave = () => {
      dotRef.current?.classList.add("cursor-hidden");
      ringRef.current?.classList.add("cursor-hidden");
    };
    const onEnter = () => {
      dotRef.current?.classList.remove("cursor-hidden");
      ringRef.current?.classList.remove("cursor-hidden");
    };
    const onDown = () => {
      dotRef.current?.classList.add("cursor-press");
      ringRef.current?.classList.add("cursor-press");
    };
    const onUp = () => {
      dotRef.current?.classList.remove("cursor-press");
      ringRef.current?.classList.remove("cursor-press");
    };

    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    const tick = () => {
      const target = pointerPosition;
      ring.current.x += (target.x - ring.current.x) * 0.32;
      ring.current.y += (target.y - ring.current.y) * 0.32;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
      }
      // Re-derived every frame (not just on pointermove) so a stationary mouse is still
      // correctly hidden/hovered the instant the element underneath it changes — e.g. when
      // the drawing canvas appears under an already-still cursor at round start.
      const el = document.elementFromPoint(target.x, target.y);
      const hovering = !!el?.closest(INTERACTIVE_SELECTOR);
      const inCanvas = !!el?.closest("[data-drawing-canvas]");
      dotRef.current?.classList.toggle("cursor-hover", hovering);
      dotRef.current?.classList.toggle("cursor-suppressed", inCanvas);
      ringRef.current?.classList.toggle("cursor-hover", hovering);
      ringRef.current?.classList.toggle("cursor-suppressed", inCanvas);
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
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden />
      <div ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
}
