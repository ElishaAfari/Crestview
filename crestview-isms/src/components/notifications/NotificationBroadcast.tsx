"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NotificationBroadcast() {
  return (
    <div className="grid gap-4">
      <Textarea placeholder="Write a broadcast notification..." />
      <Button type="button" className="w-fit">Queue broadcast</Button>
    </div>
  );
}
