import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  blue: "border-blue-800 bg-blue-700 text-white shadow-[0_10px_22px_-14px_rgba(23,78,166,0.85)] dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-100 dark:shadow-none",
  green: "border-emerald-800 bg-emerald-700 text-white shadow-[0_10px_22px_-14px_rgba(4,120,87,0.85)] dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100 dark:shadow-none",
  amber: "border-amber-800 bg-amber-600 text-white shadow-[0_10px_22px_-14px_rgba(180,83,9,0.85)] dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100 dark:shadow-none",
  red: "border-rose-800 bg-rose-700 text-white shadow-[0_10px_22px_-14px_rgba(190,18,60,0.85)] dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-100 dark:shadow-none",
  slate: "border-[#174ea6] bg-[#e8f2ff] text-[#061a4c] shadow-[0_10px_22px_-16px_rgba(23,78,166,0.7)] dark:border-[var(--portal-border)] dark:bg-[var(--portal-surface-strong)] dark:text-[var(--portal-muted)] dark:shadow-none"
};

const toneClassNames = {
  blue: "portal-badge-blue",
  green: "portal-badge-green",
  amber: "portal-badge-amber",
  red: "portal-badge-red",
  slate: "portal-badge-slate"
};

export function Badge({
  className,
  tone = "slate",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("portal-badge inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold", toneClassNames[tone], tones[tone], className)}
      {...props}
    />
  );
}
