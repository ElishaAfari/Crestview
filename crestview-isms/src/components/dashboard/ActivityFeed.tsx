import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activities = [
  "Grade 7A attendance recorded",
  "Three admissions moved to review",
  "Mathematics midterm grades published",
  "Fee reminder queued for five guardians"
];

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {activities.map((activity) => (
            <li key={activity} className="flex gap-3 text-sm text-slate-300">
              <span className="mt-1 size-2 rounded-full bg-blue-400" />
              {activity}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
