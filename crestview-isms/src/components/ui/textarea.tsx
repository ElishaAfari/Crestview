import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/30",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
