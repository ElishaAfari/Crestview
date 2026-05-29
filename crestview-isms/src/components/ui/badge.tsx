import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  blue: "border-blue-400/30 bg-blue-500/15 text-blue-100",
  green: "border-green-400/30 bg-green-500/15 text-green-100",
  amber: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  red: "border-red-400/30 bg-red-500/15 text-red-100",
  slate: "border-white/10 bg-white/10 text-slate-200"
};

export function Badge({
  className,
  tone = "slate",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}
