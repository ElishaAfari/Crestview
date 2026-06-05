"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createEventAction } from "@/features/events/actions";

type EventFormValues = {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  audience: "public" | "all" | "student" | "parent" | "teacher" | "staff";
};

export function EventForm() {
  const form = useForm<EventFormValues>({ defaultValues: { audience: "all" } });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: EventFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await createEventAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) form.reset({ audience: "all" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>Event title</Label><Input {...form.register("title")} /></div>
      <div><Label>Location</Label><Input {...form.register("location")} /></div>
      <div><Label>Starts</Label><Input type="datetime-local" {...form.register("startsAt")} /></div>
      <div><Label>Ends</Label><Input type="datetime-local" {...form.register("endsAt")} /></div>
      <div>
        <Label>Audience</Label>
        <Select {...form.register("audience")}>
          <option value="all">Whole school</option>
          <option value="public">Public website only</option>
          <option value="student">Students</option>
          <option value="parent">Parents</option>
          <option value="teacher">Teachers</option>
          <option value="staff">Staff</option>
        </Select>
      </div>
      <div className="sm:col-span-2"><Label>Description</Label><Textarea {...form.register("description")} /></div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <CalendarPlus className="size-4" aria-hidden />{form.formState.isSubmitting ? "Scheduling..." : "Schedule event"}
        </Button>
        {message ? <p className={`text-sm ${submitted ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
