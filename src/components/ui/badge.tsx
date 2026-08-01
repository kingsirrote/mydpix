import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-base-700 bg-base-800 px-2.5 py-0.5 text-xs font-medium text-ink-300",
        className
      )}
      {...props}
    />
  );
}
