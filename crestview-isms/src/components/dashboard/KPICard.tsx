"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ANIMATIONS, cn } from "@/lib/utils";

const toneClasses = {
  blue: "bg-[#174ea6] text-white ring-[#174ea6]/20 shadow-[0_10px_22px_-12px_rgba(23,78,166,0.7)] dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20 dark:shadow-none",
  green: "bg-[#047857] text-white ring-[#047857]/20 shadow-[0_10px_22px_-12px_rgba(4,120,87,0.65)] dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20 dark:shadow-none",
  amber: "bg-[#b45309] text-white ring-[#b45309]/20 shadow-[0_10px_22px_-12px_rgba(180,83,9,0.7)] dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20 dark:shadow-none",
  red: "bg-[#be123c] text-white ring-[#be123c]/20 shadow-[0_10px_22px_-12px_rgba(190,18,60,0.68)] dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/20 dark:shadow-none"
};

export function KPICard({ label, value, change, tone }: { label: string; value: string; change: string; tone: keyof typeof toneClasses }) {
  return (
    <motion.div {...ANIMATIONS.fadeInUp} {...ANIMATIONS.cardHover}>
      <Card className="portal-metric-card">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--portal-muted)]">{label}</p>
              <p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{value}</p>
            </div>
            <span className={cn("grid size-10 place-items-center rounded-lg ring-1", toneClasses[tone])}>
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--portal-muted)]">{change}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
