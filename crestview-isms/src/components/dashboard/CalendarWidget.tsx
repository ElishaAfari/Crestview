import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const events = [
  { date: "May 30", title: "Parent conferences" },
  { date: "Jun 03", title: "Science fair" },
  { date: "Jun 10", title: "Term reports" }
];

export function CalendarWidget({ items }: { items?: Array<{ id: string; title: string; starts_at: string }> }) {
  const displayEvents = items?.length
    ? items.map((event) => ({
      date: new Intl.DateTimeFormat("en-GH", { month: "short", day: "2-digit" }).format(new Date(event.starts_at)),
      title: event.title
    }))
    : events;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayEvents.map((event) => (
          <div key={event.title} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-3">
            <span className="text-sm font-bold text-[var(--portal-text)]">{event.title}</span>
            <Badge tone="blue">{event.date}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
