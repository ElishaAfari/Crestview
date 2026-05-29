import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/30",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
