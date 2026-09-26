import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 26,
  height: 26,
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/** Two doodled heads-and-shoulders, drawn slightly lopsided on purpose. */
export function IconPlayers(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12.5" cy="11" r="4.6" />
      <path d="M4.5 25c.3-5.2 3.4-8 8-8s7.6 2.9 8 8" />
      <circle cx="22" cy="9.5" r="3.4" opacity="0.85" />
      <path d="M27.5 20.5c-.2-3.6-2.3-5.6-5.5-5.8" opacity="0.85" />
    </svg>
  );
}

/** A hand-drawn stopwatch with a slightly wobbly dial and a ping mark. */
export function IconStopwatch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12.5 3.5h7" />
      <path d="M16 3.5V6" />
      <path d="M25.5 8.2l1.8-1.7" />
      <circle cx="16" cy="18" r="10.2" />
      <path d="M16 11.5c-.3 2.7-.5 5-.2 6.6" />
      <path d="M22.5 15.5c.6 1.4.5 2.3.3 2.6" opacity="0.7" />
    </svg>
  );
}

/** Two curved arrows chasing each other in a loop. */
export function IconRounds(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 14c.5-5.4 5-9 10.3-8.7 4.6.3 8.3 3.3 9.3 7.4" />
      <path d="M22 6.2l3.7 2 -1 4" />
      <path d="M26 18c-.5 5.4-5 9-10.3 8.7-4.6-.3-8.3-3.3-9.3-7.4" />
      <path d="M10 25.8L6.3 23.8l1-4" />
    </svg>
  );
}

/** A playful game controller — rounded body, two thumb bumps, a tiny d-pad. */
export function IconGameMode(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 12c-2.6.2-4.4 2-4.7 5-.3 3.6.9 7.4 3.4 7.7 2 .2 2.9-1.6 3.9-3.4 1-1.8 1.8-2.3 5.4-2.3s4.4.5 5.4 2.3c1 1.8 1.9 3.6 3.9 3.4 2.5-.3 3.7-4.1 3.4-7.7-.3-3-2.1-4.8-4.7-5-3.6-.3-10.4-.3-16 0Z" />
      <path d="M10.5 15.8v4.4" />
      <path d="M8.3 18h4.4" />
      <circle cx="23" cy="16.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="20.2" cy="19.3" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Small chevron used inside the playful dropdown trigger. */
export function IconWobblyChevron(props: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 5.5c1.6 2 3.3 4.4 5 5.5 1.7-1.2 3.3-3.4 5-5.6" />
    </svg>
  );
}

/** Checkmark used for the selected item in a dropdown menu. */
export function IconScribbleCheck(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 8.5l3.2 3.2L13 4.3" />
    </svg>
  );
}
