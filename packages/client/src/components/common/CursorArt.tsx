import type { DrawTool } from "@inkriot/shared";

/**
 * Hand-drawn cursor art. Every graphic here is drawn so its "hotspot" (the pixel that
 * actually clicks/paints) sits at a known point, exported alongside it, so the cursor
 * layer can line the tip up with the real pointer (see cursorHotspots.ts).
 */

const INK = "#1b1340";

/** Chunky doodle arrow, sun-yellow with an ink outline. Hotspot: its tip (ARROW_HOTSPOT). */
export function DoodleArrow() {
  return (
    <svg width="34" height="38" viewBox="0 0 34 38" aria-hidden>
      <path d="M8.5 9.5l3.2 22.8 5.8-7.6 8.8 9.2 4.6-4.4-8.9-8.8 8.6-4.2z" fill={INK} opacity="0.25" />
      <path
        d="M5 4l3.3 23.5 6-7.8 9 9.4 4.7-4.5-9.1-9 8.8-4.3z"
        fill="#ffc928"
        stroke={INK}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M8.6 9.5l1.5 10" stroke="#fffdf7" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

/** Cartoon pointing glove for anything clickable. Hotspot: the fingertip. */
export function DoodleHand() {
  return (
    <svg width="36" height="40" viewBox="0 0 36 40" aria-hidden>
      <path
        d="M16 34.5c-4.2 0-7.3-2.2-9-5.6l-3.5-7c-.8-1.6-.2-3.2 1.2-3.8 1.3-.6 2.7 0 3.5 1.3l2 3.3V5.5c0-1.7 1.2-3 2.8-3s2.8 1.3 2.8 3v10.2c.4-1.4 1.5-2.3 2.8-2.3 1.5 0 2.7 1.2 2.7 2.8v.6c.4-1.2 1.4-2 2.7-2 1.5 0 2.6 1.2 2.6 2.8v1c.4-1 1.3-1.6 2.4-1.6 1.4 0 2.5 1.2 2.5 2.7v7.1c0 5.3-4 9.7-9.3 9.7z"
        fill="#fffdf7"
        stroke={INK}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M19.4 16.5v5M24.8 17.6v4.2M29.6 19v3.4" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 36.5h16" stroke="#ff7ec7" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * In-canvas tool cursors. All are drawn in a 40×40 box with the working tip at the
 * bottom-left corner (TOOL_HOTSPOT), leaning up-right like a pen held in a right hand.
 * `color` tints the part that touches the paper.
 */
export function ToolCursorArt({ tool, color }: { tool: DrawTool; color: string }) {
  const tip = color.toUpperCase() === "#FFFFFF" ? "#f3f0e6" : color;
  switch (tool) {
    case "eraser":
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
          <g transform="rotate(-40 14 26)">
            <rect x="4" y="18" width="30" height="14" rx="3.5" fill="#ff7ec7" stroke={INK} strokeWidth="2.4" />
            <rect x="4" y="18" width="11" height="14" rx="3.5" fill="#fffdf7" stroke={INK} strokeWidth="2.4" />
            <path d="M20 21.5h10" stroke="#fffdf7" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          </g>
          <path d="M1.5 38.5l3-1.2M1 35l2.4.2" stroke={INK} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        </svg>
      );
    case "fill":
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
          <g transform="rotate(-25 22 18)">
            <path d="M12 12h20l-2.4 18c-.2 1.4-1.4 2.4-2.8 2.4H17.2c-1.4 0-2.6-1-2.8-2.4z" fill="#3ea8ff" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            <ellipse cx="22" cy="12" rx="10" ry="3.2" fill={tip} stroke={INK} strokeWidth="2.4" />
            <path d="M14 11c0-6 16-6 16 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          </g>
          {/* the drip is the hotspot */}
          <path d="M3 37c-1.9 0-3-1.3-3-2.9 0-1.8 3-6.1 3-6.1s3 4.3 3 6.1c0 1.6-1.1 2.9-3 2.9z" fill={tip} stroke={INK} strokeWidth="1.8" />
        </svg>
      );
    case "brush":
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
          <path d="M22 18L35 5" stroke="#c98a5b" strokeWidth="5" strokeLinecap="round" />
          <path d="M22 18L35 5" stroke={INK} strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
          <path d="M17.5 17.5l5 5 2.5-2.5-5-5z" fill="#c0c3cc" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M3 37c1-6.5 4.4-13.8 9.8-17.2l7.4 7.4C16.8 32.6 9.5 36 3 37z" fill={tip} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      );
    case "marker":
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
          <path d="M11 22l15-15c1.5-1.5 4-1.5 5.5 0l1.5 1.5c1.5 1.5 1.5 4 0 5.5L18 29z" fill={tip} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M22 11l7 7" stroke="#fffdf7" strokeWidth="2.4" opacity="0.7" />
          <path d="M11 22l7 7-6 2.5-3.5-3.5z" fill="#fffdf7" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M8.5 28l3.5 3.5L3 37z" fill={tip} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "pencil":
    default:
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
          {/* eraser end + ferrule */}
          <path d="M28.5 5.5l2-2c1.4-1.4 3.6-1.4 5 0l1 1c1.4 1.4 1.4 3.6 0 5l-2 2z" fill="#ff7ec7" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M26 8l2.5-2.5 6 6L32 14z" fill="#c0c3cc" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          {/* body */}
          <path d="M9 25L26 8l6 6-17 17z" fill="#ffc928" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M12 26L28.5 9.5" stroke="#fffdf7" strokeWidth="1.8" opacity="0.7" />
          {/* sharpened wood + coloured lead */}
          <path d="M9 25l6 6-10 4.5z" fill="#f5c9a4" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M3 37l2.1-5.2 3.1 3.1z" fill={tip} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
  }
}
