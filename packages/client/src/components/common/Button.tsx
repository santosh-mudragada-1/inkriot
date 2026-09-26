import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { audio } from "../../lib/audio/AudioManager";
import "./Button.css";

type Variant = "primary" | "secondary" | "ghost" | "accent2" | "grape" | "mint";
type Size = "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
  /** Set the label in the chunky display face (big CTAs only). */
  display?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", display = false, className = "", onClick, onMouseEnter, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={`btn btn-${variant} btn-${size} ${display ? "btn-display" : ""} ${className}`}
        whileTap={{ scale: 0.96, transition: { duration: 0.08 } }}
        whileHover={{ scale: 1.04, rotate: -1.2, transition: { type: "spring", stiffness: 500, damping: 15 } }}
        onMouseEnter={(e) => {
          audio.playHover();
          onMouseEnter?.(e);
        }}
        onClick={(e) => {
          audio.playClick();
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
