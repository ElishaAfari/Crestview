import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const events = [
  { date: "May 30", title: "Parent conferences" },
  { date: "Jun 03", title: "Science fair" },
  { date: "Jun 10", title: "Term reports" }
];

export function CalendarWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <div key={event.title} className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] p-3">
            <span className="text-sm text-slate-200">{event.title}</span>
            <Badge tone="blue">{event.date}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
