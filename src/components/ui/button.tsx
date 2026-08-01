import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-signal text-base-950 hover:bg-signal-glow shadow-[0_0_0_1px_rgba(255,90,31,0.4)]",
  secondary: "bg-base-800 text-ink-100 hover:bg-base-700 border border-base-700",
  ghost: "bg-transparent text-ink-100 hover:bg-base-800",
  outline: "bg-transparent border border-base-700 text-ink-100 hover:border-signal hover:text-signal",
  danger: "bg-red-600/90 text-white hover:bg-red-600",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
