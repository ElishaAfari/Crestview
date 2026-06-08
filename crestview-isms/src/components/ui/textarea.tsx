import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "portal-field min-h-28 w-full rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-3 py-2 text-sm font-semibold text-[var(--portal-text)] outline-none transition placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/30",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
