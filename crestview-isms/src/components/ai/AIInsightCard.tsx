import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AIInsightCard({ insight }: { insight: string }) {
  return (
    <Card>
      <CardContent className="flex gap-3 p-5">
        <Sparkles className="mt-1 size-5 text-blue-700 dark:text-blue-300" aria-hidden />
        <p className="text-sm leading-6 text-[var(--portal-muted)]">{insight}</p>
      </CardContent>
    </Card>
  );
}
