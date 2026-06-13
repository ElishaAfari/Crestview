import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isGreen =
    normalized.includes("on track") ||
    normalized.includes("complete") ||
    normalized.includes("paid") && !normalized.includes("unpaid") ||
    normalized.includes("present") ||
    normalized.includes("active") ||
    normalized.includes("accepted") ||
    normalized.includes("hired") ||
    normalized.includes("approved") ||
    normalized.includes("published") ||
    normalized.includes("resolved");
  const isRed =
    normalized.includes("needs support") ||
    normalized.includes("rejected") ||
    normalized.includes("denied") ||
    normalized.includes("absent") ||
    normalized.includes("overdue") ||
    normalized.includes("failed") ||
    normalized.includes("disabled") ||
    normalized.includes("void") ||
    normalized.includes("blocked");
  const isAmber =
    normalized.includes("watch") ||
    normalized.includes("late") ||
    normalized.includes("open") ||
    normalized.includes("submitted") ||
    normalized.includes("review") ||
    normalized.includes("screening") ||
    normalized.includes("interview") ||
    normalized.includes("offer") ||
    normalized.includes("invited") ||
    normalized.includes("draft") ||
    normalized.includes("wait") ||
    normalized.includes("pending") ||
    normalized.includes("partial") ||
    normalized.includes("unpaid");
  const tone =
    isGreen
      ? "green"
      : isRed
        ? "red"
        : isAmber
          ? "amber"
          : "slate";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}
