import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-base-700 bg-base-900/60 backdrop-blur-sm", className)}
      {...props}
    />
  );
}
