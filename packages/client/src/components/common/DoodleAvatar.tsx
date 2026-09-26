import { memo } from "react";
import { AVATAR_FILLS, decodeAvatar, type AvatarConfig } from "../../lib/avatar";

const INK = "#1B1340";
const PAPER = "#FFFDF7";

const BODIES = [
  "M50 18C78 18 88 42 88 66V106H12V66C12 42 22 18 50 18Z",
  "M46 16C74 12 90 34 86 60C84 76 90 90 88 106H12C10 84 14 70 14 56C14 32 26 18 46 16Z",
  "M20 22Q50 14 80 22Q88 24 88 34V106H12V34Q12 24 20 22Z",
  "M50 16C64 16 70 24 80 30C92 38 88 52 90 64V106H10V62C10 50 8 38 20 30C30 24 36 16 50 16Z",
  "M12 106V48L20 24L30 38L40 18L50 34L60 16L70 36L80 22L88 46V106Z",
  "M14 106V44L18 14L36 30Q50 26 64 30L82 14L86 44V106Z",
];

function Eyes({ kind }: { kind: number }) {
  const s = { stroke: INK, strokeWidth: 3.2, strokeLinecap: "round" as const, fill: "none" };
  switch (kind) {
    case 1:
      return (
        <g>
          <circle cx="37" cy="50" r="8.5" fill={PAPER} stroke={INK} strokeWidth="3" />
          <circle cx="63" cy="50" r="8.5" fill={PAPER} stroke={INK} strokeWidth="3" />
          <circle cx="39.5" cy="52" r="3.6" fill={INK} />
          <circle cx="60.5" cy="48" r="3.6" fill={INK} />
        </g>
      );
    case 2:
      return (
        <g {...s}>
          <path d="M31 53Q37 44 43 53" />
          <path d="M57 53Q63 44 69 53" />
        </g>
      );
    case 3:
      return (
        <g {...s}>
          <path d="M31 50Q37 56 43 50" />
          <path d="M57 50Q63 56 69 50" />
          <path d="M30 45L44 47M56 47L70 45" strokeWidth="2.4" />
        </g>
      );
    case 4:
      return (
        <g>
          <circle cx="37" cy="50" r="4.4" fill={INK} />
          <path d="M56 51Q63 45 70 51" {...s} />
        </g>
      );
    case 5:
      return (
        <g>
          <circle cx="50" cy="47" r="12" fill={PAPER} stroke={INK} strokeWidth="3" />
          <circle cx="52" cy="48" r="5.5" fill={INK} />
          <circle cx="54" cy="46" r="1.8" fill={PAPER} />
        </g>
      );
    case 6:
      return (
        <g>
          <path d="M26 44H46Q46 56 36 56Q26 56 26 44Z" fill={INK} />
          <path d="M54 44H74Q74 56 64 56Q54 56 54 44Z" fill={INK} />
          <path d="M44 46H56M26 45L20 42M74 45L80 42" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M30 47L34 47" stroke={PAPER} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 7:
      return (
        <g fill="#FFC928" stroke={INK} strokeWidth="2.4" strokeLinejoin="round">
          <path d="M37 40L40 47L47 50L40 53L37 60L34 53L27 50L34 47Z" />
          <path d="M63 40L66 47L73 50L66 53L63 60L60 53L53 50L60 47Z" />
        </g>
      );
    default:
      return (
        <g fill={INK}>
          <circle cx="37" cy="50" r="4.4" />
          <circle cx="63" cy="50" r="4.4" />
          <circle cx="38.5" cy="48.5" r="1.4" fill={PAPER} />
          <circle cx="64.5" cy="48.5" r="1.4" fill={PAPER} />
        </g>
      );
  }
}

function Mouth({ kind }: { kind: number }) {
  const s = { stroke: INK, strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  switch (kind) {
    case 1:
      return (
        <g>
          <path d="M37 64H63Q63 80 50 80Q37 80 37 64Z" fill={INK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M43 75Q50 70 57 75Q55 80 50 80Q45 80 43 75Z" fill="#FF7EC7" />
        </g>
      );
    case 2:
      return <path d="M41 69H59" {...s} />;
    case 3:
      return <ellipse cx="50" cy="70" rx="5" ry="6" fill={INK} />;
    case 4:
      return (
        <g>
          <path d="M44 72L48 80Q50 83 52 80L56 72Z" fill="#FF7EC7" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M38 67Q50 76 62 67" {...s} />
        </g>
      );
    case 5:
      return (
        <g>
          <path d="M38 66Q50 74 62 66" {...s} />
          <path d="M42 68L44.5 74L47 69.6M53 69.6L55.5 74L58 68" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </g>
      );
    case 6:
      return <path d="M37 70Q40.5 65 44 70T51 70T58 70T65 70" {...s} />;
    case 7:
      return <path d="M40 66Q45 73 50 67Q55 73 60 66" {...s} />;
    default:
      return <path d="M39 66Q50 77 61 66" {...s} />;
  }
}

function Hat({ kind }: { kind: number }) {
  const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (kind) {
    case 1:
      return (
        <g {...line}>
          <path d="M34 24L50 -10L66 24Z" fill="#FF7EC7" />
          <path d="M39 13L57 17M43 3L55 6" stroke={PAPER} strokeWidth="3.5" />
          <circle cx="50" cy="-11" r="5" fill="#FFC928" />
        </g>
      );
    case 2:
      return (
        <g {...line}>
          <path d="M22 28Q22 0 50 0Q78 0 78 28Z" fill="#3EA8FF" />
          <rect x="18" y="22" width="64" height="11" rx="5.5" fill="#FFC928" />
          <circle cx="50" cy="-3" r="6" fill={PAPER} />
        </g>
      );
    case 3:
      return (
        <g {...line} transform="rotate(12 64 18)">
          <path d="M64 18L78 8V28Z" fill="#FF7EC7" />
          <path d="M64 18L50 8V28Z" fill="#FF7EC7" />
          <circle cx="64" cy="18" r="5" fill="#FF5A36" />
        </g>
      );
    case 4:
      return (
        <g {...line}>
          <path d="M14 50Q14 4 50 4Q86 4 86 50" fill="none" strokeWidth="6" />
          <rect x="4" y="40" width="16" height="24" rx="7" fill="#FF5A36" />
          <rect x="80" y="40" width="16" height="24" rx="7" fill="#FF5A36" />
        </g>
      );
    case 5:
      return (
        <g {...line}>
          <path d="M26 26Q26 2 50 2Q74 2 74 26Z" fill="#FFC928" />
          <path d="M50 2V26" stroke={INK} strokeWidth="2.4" />
          <path d="M38 5Q42 16 42 26M62 5Q58 16 58 26" fill="none" strokeWidth="2.4" />
          <path d="M50 2V-8" />
          <ellipse cx="38" cy="-9" rx="12" ry="4" fill="#FF5A36" />
          <ellipse cx="62" cy="-9" rx="12" ry="4" fill="#3EA8FF" />
          <circle cx="50" cy="-9" r="3" fill={INK} />
        </g>
      );
    case 6:
      return (
        <g {...line}>
          <path d="M26 24L60 -18L76 24Z" fill="#7B5CFF" />
          <ellipse cx="50" cy="25" rx="36" ry="7" fill="#7B5CFF" />
          <path d="M52 4L54 9L59 10L55 13L56 18L52 15L48 18L49 13L45 10L50 9Z" fill="#FFC928" strokeWidth="1.8" />
          <circle cx="62" cy="-4" r="2" fill="#FFC928" stroke="none" />
        </g>
      );
    case 7:
      return (
        <g>
          <ellipse cx="50" cy="0" rx="24" ry="7" fill="none" stroke={INK} strokeWidth="8" />
          <ellipse cx="50" cy="0" rx="24" ry="7" fill="none" stroke="#FFC928" strokeWidth="4.5" />
        </g>
      );
    case 8:
      return (
        <g {...line}>
          <path d="M26 26V2L38 13L50 -4L62 13L74 2V26Z" fill="#FFC928" />
          <circle cx="50" cy="16" r="4" fill="#FF5A36" strokeWidth="2.2" />
          <circle cx="36" cy="19" r="3" fill="#3EA8FF" strokeWidth="2" />
          <circle cx="64" cy="19" r="3" fill="#2FD4A0" strokeWidth="2" />
        </g>
      );
    case 9:
      return (
        <g {...line}>
          <path d="M20 30C14 14 26 8 26 -4C34 4 36 10 38 14C38 2 44 -8 52 -16C54 -4 62 2 62 12C66 6 68 0 70 -6C80 6 88 20 80 30Z" fill="#FF5A36" />
          <path d="M34 28C32 20 36 16 38 10C42 16 44 20 46 22C48 14 52 8 54 2C58 10 62 16 62 22C64 18 66 16 68 12C72 20 72 26 68 28Z" fill="#FFC928" strokeWidth="2.2" />
        </g>
      );
    default:
      return null;
  }
}

interface DoodleAvatarProps {
  avatar?: string | AvatarConfig | null;
  /** Used to derive a stable avatar when none is set (e.g. the player's id). */
  seed?: string;
  size?: number;
  /** "bust" crops tightly to the face for small discs; "full" leaves room for tall hats. */
  crop?: "bust" | "full";
  className?: string;
  title?: string;
}

export const DoodleAvatar = memo(function DoodleAvatar({ avatar, seed = "", size = 64, crop = "full", className, title }: DoodleAvatarProps) {
  const cfg = typeof avatar === "object" && avatar ? avatar : decodeAvatar(avatar as string | null | undefined, seed);
  const fill = AVATAR_FILLS[cfg.color];
  const viewBox = crop === "bust" ? "6 2 88 88" : "-4 -22 108 128";
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={BODIES[cfg.body]} fill={fill} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      {/* belly highlight gives the flat shape a little volume */}
      <path d="M26 36Q30 28 38 25" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="29" cy="62" rx="6" ry="3.5" fill="#FF5A7A" opacity="0.35" />
      <ellipse cx="71" cy="62" rx="6" ry="3.5" fill="#FF5A7A" opacity="0.35" />
      <Eyes kind={cfg.eyes} />
      <Mouth kind={cfg.mouth} />
      <Hat kind={cfg.hat} />
    </svg>
  );
});
