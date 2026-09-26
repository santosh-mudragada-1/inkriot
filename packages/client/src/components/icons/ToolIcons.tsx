import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/** A hand-drawn pencil, tip pointed down-left, drawn at a jaunty angle. */
export function IconPenTool(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 27.5c1-4.4 2-8 3.3-10.7L21.8 6.3c1-1 2.6-1 3.8.1 1.2 1.2 1.3 2.9.2 3.9l-9.6 10.4c-2.5 1.7-5.6 3.2-9 6.1Z" />
      <path d="M19.5 8.6l4 3.9" />
      <path d="M9 27.5c1.4-.4 2.8-.9 4.2-1.6" opacity="0.8" />
    </svg>
  );
}

/** A chunky, slightly rotated eraser block. */
export function IconEraserTool(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11.5 25.5h13.5" />
      <path d="M12.8 25.4L6.3 19c-1-1-1-2.6.1-3.7L16.9 5.1c1.1-1 2.8-1 3.8.1l6 6.2c1 1 .9 2.7-.1 3.7L15 26" />
      <path d="M17.3 10.6l7.4 7.3" opacity="0.75" />
    </svg>
  );
}

/** A tipping paint bucket with a drop escaping. */
export function IconPaintBucketTool(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 15.3L16.4 6l11 8-12 9.4L4.5 15.3Z" />
      <path d="M4.5 15.3c-1 2 .3 3.6 3 3.9 3.4.4 6.6-.4 8-2" opacity="0.85" />
      <path d="M24 14.5c1.6 2 2.4 3.6 2.4 4.9 0 1.5-1.1 2.6-2.4 2.6s-2.4-1.1-2.4-2.6c0-1.3.8-2.9 2.4-4.9Z" fill="currentColor" opacity="0.9" />
      <path d="M11.5 9.6L20 16" opacity="0.6" />
    </svg>
  );
}

/** A single curved undo arrow. */
export function IconUndoTool(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 13.5H19c4 0 7.2 3 7.2 7s-3.2 7-7.2 7h-5.5" />
      <path d="M11.7 8L6.3 13.4l5.4 5.4" />
    </svg>
  );
}

/** A hand-drawn trash can for clearing the canvas. */
export function IconTrashTool(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 10.3h18" />
      <path d="M12.5 10.3V7.6c0-.9.8-1.6 1.8-1.6h3.4c1 0 1.8.7 1.8 1.6v2.7" />
      <path d="M9.2 10.3l1.2 15.3c.1 1 1 1.8 2 1.8h7.2c1 0 1.9-.8 2-1.8l1.2-15.3" />
      <path d="M14.3 14.8l.4 8" opacity="0.75" />
      <path d="M17.7 14.8l-.4 8" opacity="0.75" />
    </svg>
  );
}
