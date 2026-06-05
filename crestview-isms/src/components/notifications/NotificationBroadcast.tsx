"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { broadcastNotificationAction } from "@/features/notifications/actions";

export function NotificationBroadcast() {
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(formData: FormData) {
    const result = await broadcastNotificationAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
        <div><Label>Title</Label><Input required name="title" placeholder="Admission reminder" /></div>
        <div>
          <Label>Audience</Label>
          <Select name="audience" defaultValue="all">
            <option value="all">All active users</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
            <option value="teacher">Teachers</option>
            <option value="hr_staff">HR staff</option>
            <option value="finance_officer">Finance officers</option>
            <option value="librarian">Librarians</option>
            <option value="it_support">IT support</option>
          </Select>
        </div>
      </div>
      <div><Label>Message</Label><Textarea required name="body" placeholder="Write a broadcast notification..." /></div>
      <div className="flex flex-col items-start gap-3">
        <Button type="submit" className="w-fit"><Send className="size-4" aria-hidden />Queue broadcast</Button>
        {message ? <p className={`text-sm ${submitted ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
