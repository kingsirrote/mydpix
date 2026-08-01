import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-base-700 bg-base-900 px-4 py-3 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition-colors focus:border-signal resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
