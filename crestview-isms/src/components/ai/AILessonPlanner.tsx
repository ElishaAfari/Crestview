"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AILessonPlanner() {
  const [topic, setTopic] = useState("");
  const [plan, setPlan] = useState("Lesson structure will appear here.");

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Topic</Label><Input value={topic} onChange={(event) => setTopic(event.target.value)} /></div>
        <div><Label>Duration</Label><Input defaultValue="45 minutes" /></div>
      </div>
      <div><Label>Learning objectives</Label><Textarea /></div>
      <Button type="button" className="w-fit" onClick={() => setPlan(`Hook, instruction, practice, assessment, and differentiation plan for ${topic || "the selected topic"}.`)}>
        Generate plan
      </Button>
      <div className="rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-4 text-sm font-medium text-[var(--portal-text)] shadow-sm">{plan}</div>
    </div>
  );
}
