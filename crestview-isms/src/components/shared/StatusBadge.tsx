import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const tone = status.includes("paid") || status.includes("present") || status.includes("active") ? "green" : status.includes("late") || status.includes("open") ? "amber" : "slate";
  return <Badge tone={tone}>{status}</Badge>;
}
