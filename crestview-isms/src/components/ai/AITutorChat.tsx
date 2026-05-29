"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AITutorChat() {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("Ask a question and I will guide you step by step.");

  async function submitQuestion() {
    if (!question.trim()) {
      return;
    }

    setReply("Thinking through the next useful question...");
    const response = await fetch("/api/ai/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question })
    });
    setReply(response.ok ? await response.text() : "The tutor is not available yet. Check API credentials and session.");
  }

  return (
    <div className="grid gap-4">
      <div className="min-h-40 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-200">{reply}</div>
      <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What are you working on?" />
      <Button type="button" onClick={submitQuestion} className="w-fit">
        <Send className="size-4" aria-hidden />
        Ask tutor
      </Button>
    </div>
  );
}
