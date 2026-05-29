"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ANIMATIONS, cn } from "@/lib/utils";

const toneClasses = {
  blue: "text-blue-200 bg-blue-500/15",
  green: "text-green-200 bg-green-500/15",
  amber: "text-amber-200 bg-amber-500/15",
  red: "text-red-200 bg-red-500/15"
};

export function KPICard({ label, value, change, tone }: { label: string; value: string; change: string; tone: keyof typeof toneClasses }) {
  return (
    <motion.div {...ANIMATIONS.fadeInUp} {...ANIMATIONS.cardHover}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-white">{value}</p>
            </div>
            <span className={cn("grid size-9 place-items-center rounded-lg", toneClasses[tone])}>
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-400">{change}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
