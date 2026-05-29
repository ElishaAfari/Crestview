"use client";

import { Textarea } from "@/components/ui/textarea";

export function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Write notes, feedback, or instructions..."
    />
  );
}
