import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("paid") ||
    normalized.includes("present") ||
    normalized.includes("active") ||
    normalized.includes("accepted") ||
    normalized.includes("hired") ||
    normalized.includes("approved")
      ? "green"
      : normalized.includes("rejected") ||
          normalized.includes("denied") ||
          normalized.includes("absent") ||
          normalized.includes("overdue") ||
          normalized.includes("failed") ||
          normalized.includes("disabled") ||
          normalized.includes("void")
        ? "red"
        : normalized.includes("late") ||
            normalized.includes("open") ||
            normalized.includes("submitted") ||
            normalized.includes("review") ||
            normalized.includes("screening") ||
            normalized.includes("interview") ||
            normalized.includes("offer") ||
            normalized.includes("invited") ||
            normalized.includes("draft") ||
            normalized.includes("wait")
          ? "amber"
          : "slate";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}
