import { Badge } from "@/components/ui/badge";

export function AIPredictionBadge({ level }: { level: "green" | "amber" | "red" }) {
  const labels = { green: "On track", amber: "Needs attention", red: "At risk" };
  return <Badge tone={level === "green" ? "green" : level === "amber" ? "amber" : "red"}>{labels[level]}</Badge>;
}
