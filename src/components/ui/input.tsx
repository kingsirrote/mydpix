import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-base-700 bg-base-900 px-4 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition-colors focus:border-signal",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
