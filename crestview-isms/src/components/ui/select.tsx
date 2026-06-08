import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "portal-field h-10 w-full rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-3 text-sm font-semibold text-[var(--portal-text)] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
