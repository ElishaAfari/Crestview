import { CalendarPlus, FilePlus2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  { label: "New Student", icon: UserPlus },
  { label: "Create Invoice", icon: FilePlus2 },
  { label: "Schedule Event", icon: CalendarPlus }
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button key={action.label} variant="secondary" className="justify-start">
              <Icon className="size-4" aria-hidden />
              {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
