"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ANIMATIONS, cn } from "@/lib/utils";

const toneClasses = {
  blue: "text-blue-800 bg-blue-100 ring-blue-200 dark:text-blue-200 dark:bg-blue-500/15 dark:ring-blue-400/20",
  green: "text-emerald-800 bg-emerald-100 ring-emerald-200 dark:text-emerald-200 dark:bg-emerald-500/15 dark:ring-emerald-400/20",
  amber: "text-amber-800 bg-amber-100 ring-amber-200 dark:text-amber-200 dark:bg-amber-500/15 dark:ring-amber-400/20",
  red: "text-rose-800 bg-rose-100 ring-rose-200 dark:text-rose-200 dark:bg-rose-500/15 dark:ring-rose-400/20"
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
