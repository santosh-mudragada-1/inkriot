import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { audio } from "../../lib/audio/AudioManager";
import "./Button.css";

type Variant = "primary" | "secondary" | "ghost" | "accent2";
type Size = "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", onClick, onMouseEnter, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={`btn btn-${variant} btn-${size} ${className}`}
        whileTap={{ scale: 0.96, transition: { duration: 0.08 } }}
        whileHover={{ scale: 1.03, transition: { duration: 0.14, ease: "easeOut" } }}
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
