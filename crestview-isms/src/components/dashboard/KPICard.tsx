"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ANIMATIONS, cn } from "@/lib/utils";

const toneClasses = {
  blue: "portal-tone-blue",
  green: "portal-tone-green",
  amber: "portal-tone-amber",
  red: "portal-tone-red"
};

const accentClasses = {
  blue: "portal-accent-blue",
  green: "portal-accent-green",
  amber: "portal-accent-amber",
  red: "portal-accent-red"
};

export function KPICard({ label, value, change, tone }: { label: string; value: string; change: string; tone: keyof typeof toneClasses }) {
  return (
    <motion.div {...ANIMATIONS.fadeInUp} {...ANIMATIONS.cardHover}>
      <Card className={cn("portal-metric-card overflow-hidden", accentClasses[tone])}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--portal-muted)]">{label}</p>
              <p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{value}</p>
            </div>
            <span className={cn("portal-icon-tile size-12 rounded-lg", toneClasses[tone])}>
              <ArrowUpRight className="size-5 stroke-[2.5]" aria-hidden />
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--portal-muted)]">{change}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
