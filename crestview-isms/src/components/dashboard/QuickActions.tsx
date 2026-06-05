import { CalendarPlus, FilePlus2, UserPlus } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const actions = [
  { label: "New Student", icon: UserPlus, href: "/admin/students#add-student" },
  { label: "Create Invoice", icon: FilePlus2, href: "/admin/fees#create-invoice" },
  { label: "Schedule Event", icon: CalendarPlus, href: "/admin/settings#schedule-event" }
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
            <Link key={action.label} href={action.href} className={cn(buttonVariants({ variant: "secondary" }), "justify-start")}>
              <Icon className="size-4" aria-hidden />
              {action.label}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
