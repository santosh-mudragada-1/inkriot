import type { TargetAndTransition } from "framer-motion";

/**
 * Each reaction emoji floats up with its own personality. `dir` (±1) mirrors the
 * sideways motion so a burst of the same emoji doesn't move in lockstep.
 */
export function reactionMotion(emoji: string, dir: number): TargetAndTransition {
  const rise = -220;
  const t = { duration: 2.8, ease: "easeOut" as const };
  switch (emoji) {
    case "😂": // belly laugh: shakes all the way up
      return {
        y: [0, -40, -90, -140, -190, rise],
        rotate: [0, -18, 18, -18, 18, -10, 12, 0],
        scale: [0.3, 1.5, 1.2, 1.35, 1.2, 1.1],
        opacity: [0, 1, 1, 1, 1, 0],
        transition: t,
      };
    case "🔥": // flickers and shoots up fast
      return {
        y: [0, -80, -160, -260],
        scale: [0.4, 1.4, 0.95, 1.35, 1, 1.25, 0.8],
        rotate: [0, -6, 6, -4, 4, 0],
        opacity: [0, 1, 1, 1, 1, 0],
        transition: { duration: 2.2, ease: "easeOut" },
      };
    case "💀": // floats up, does a death-spin, then sinks
      return {
        y: [0, -120, -170, -140, -60],
        rotate: [0, 0, 360 * dir, 360 * dir, 380 * dir],
        scale: [0.3, 1.3, 1.2, 1, 0.8],
        opacity: [0, 1, 1, 1, 0],
        transition: { duration: 2.9, ease: "easeInOut" },
      };
    case "👏": // clap clap clap
      return {
        y: [0, -60, -110, -160, rise],
        scale: [0.3, 1.5, 1, 1.5, 1, 1.5, 1, 1.2],
        rotate: [0, 8 * dir, -8 * dir, 8 * dir, 0],
        opacity: [0, 1, 1, 1, 1, 0],
        transition: t,
      };
    case "😭": // sobbing sway, like a leaf falling upwards
      return {
        y: [0, -60, -120, -180, rise],
        x: [0, 30 * dir, -30 * dir, 25 * dir, 0],
        rotate: [0, 14 * dir, -14 * dir, 10 * dir, 0],
        scale: [0.3, 1.3, 1.2, 1.2, 1],
        opacity: [0, 1, 1, 1, 0],
        transition: t,
      };
    case "🤯": // swells and blows up
      return {
        y: [0, -90, -120, -130],
        scale: [0.3, 1.2, 1.4, 2.6],
        rotate: [0, -6, 6, 0],
        opacity: [0, 1, 1, 0],
        transition: { duration: 2.2, ease: "easeIn", times: [0, 0.35, 0.75, 1] },
      };
    case "🎨": // twirls like a thrown palette
      return {
        y: [0, -100, -170, rise],
        x: [0, 40 * dir, 60 * dir, 70 * dir],
        rotate: [0, 360 * dir, 720 * dir],
        scale: [0.3, 1.3, 1.1, 1],
        opacity: [0, 1, 1, 0],
        transition: t,
      };
    case "👀": // shifty side-eye glances
      return {
        y: [0, -70, -70, -130, -130, rise],
        x: [0, 0, -26, 26, -20, 0],
        scale: [0.3, 1.4, 1.3, 1.3, 1.3, 1.1],
        opacity: [0, 1, 1, 1, 1, 0],
        transition: { duration: 3, ease: "easeInOut" },
      };
    default:
      return {
        y: [0, rise],
        rotate: [0, 20 * dir],
        scale: [0.4, 1.4, 1],
        opacity: [0, 1, 0],
        transition: t,
      };
  }
}
