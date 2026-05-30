"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactAction } from "@/features/contact/actions";

type ContactFormValues = { fullName: string; email: string; phone?: string; subject?: string; message: string };

export function ContactForm() {
  const form = useForm<ContactFormValues>();
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: ContactFormValues) {
    setMessage(null);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value ?? ""));
    const result = await submitContactAction(formData);
    setMessage(result.message);
    setSubmitted(result.ok);
    if (result.ok) form.reset();
  }

  const fieldClassName = "mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label className="text-slate-700">Full name</Label><Input required className={fieldClassName} {...form.register("fullName")} /></div>
      <div><Label className="text-slate-700">Email</Label><Input required type="email" className={fieldClassName} {...form.register("email")} /></div>
      <div><Label className="text-slate-700">Phone</Label><Input type="tel" className={fieldClassName} {...form.register("phone")} /></div>
      <div><Label className="text-slate-700">Subject</Label><Input className={fieldClassName} {...form.register("subject")} /></div>
      <div className="sm:col-span-2"><Label className="text-slate-700">Message</Label><Textarea required className={fieldClassName} {...form.register("message")} /></div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting} className="bg-[#cf1017] text-white hover:bg-[#ad0d13]">
          <Send className="size-4" aria-hidden />{form.formState.isSubmitting ? "Sending..." : "Send message"}
        </Button>
        {message ? <p className={`text-sm font-medium ${submitted ? "text-emerald-700" : "text-red-700"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
