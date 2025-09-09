import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { useHapticFeedbackContext } from "../helpers/HapticFeedbackContext";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "outline"
    | "ghost"
    | "link"
    | "secondary"
    | "destructive";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm" | "icon-md" | "icon-lg";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      asChild = false,
      className,
      disabled,
      type = "button",
      onClick,
      ...props
    },
    ref,
  ) => {
    const { triggerHapticFeedback } = useHapticFeedbackContext();
    const Comp = asChild ? Slot : "button";

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        // Provide haptic feedback for important button interactions
        if (variant === "primary" || variant === "destructive") {
          triggerHapticFeedback(100); // Strong feedback for primary actions
        } else if (variant === "secondary" || variant === "outline") {
          triggerHapticFeedback(75); // Medium feedback for secondary actions
        } else {
          triggerHapticFeedback(50); // Light feedback for ghost/link buttons
        }
      }
      onClick?.(e);
    };

    return (
      <Comp
        ref={ref}
        type={type}
        className={`
        ${styles.button} 
        ${styles[variant]} 
        ${styles[size]} 
        ${disabled ? styles.disabled : ""} 
        ${className || ""}
      `}
        disabled={disabled}
        onClick={asChild ? onClick : handleClick}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);

Button.displayName = "Button";
