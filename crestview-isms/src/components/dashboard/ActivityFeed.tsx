import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activities = [
  "Grade 7A attendance recorded",
  "Three admissions moved to review",
  "Mathematics midterm grades published",
  "Fee reminder queued for five guardians"
];

export function ActivityFeed({ items }: { items?: string[] }) {
  const displayActivities = items?.length ? items : activities;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {displayActivities.map((activity) => (
            <li key={activity} className="flex gap-3 text-sm font-semibold text-[var(--portal-text)]">
              <span className="mt-1 size-2 rounded-full bg-blue-600" />
              {activity}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
