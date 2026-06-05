"use client";

import { useActionState, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitJobApplicationAction } from "@/features/recruitment/actions";

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };

export function JobApplicationForm({ jobPostingId, compact = false }: { jobPostingId?: string; compact?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => {
    const result = await submitJobApplicationAction(formData);
    if (result.ok) formRef.current?.reset();
    return result;
  }, initialState);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
      {jobPostingId ? <input type="hidden" name="jobPostingId" value={jobPostingId} /> : null}
      <div>
        <label className="text-xs font-black uppercase text-[#06165b]" htmlFor={`firstName-${jobPostingId ?? "general"}`}>First name</label>
        <input id={`firstName-${jobPostingId ?? "general"}`} required name="firstName" className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#06165b] focus:ring-2 focus:ring-[#42d6d0]/40" />
      </div>
      <div>
        <label className="text-xs font-black uppercase text-[#06165b]" htmlFor={`lastName-${jobPostingId ?? "general"}`}>Last name</label>
        <input id={`lastName-${jobPostingId ?? "general"}`} required name="lastName" className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#06165b] focus:ring-2 focus:ring-[#42d6d0]/40" />
      </div>
      <div>
        <label className="text-xs font-black uppercase text-[#06165b]" htmlFor={`email-${jobPostingId ?? "general"}`}>Email</label>
        <input id={`email-${jobPostingId ?? "general"}`} required name="email" type="email" className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#06165b] focus:ring-2 focus:ring-[#42d6d0]/40" />
      </div>
      <div>
        <label className="text-xs font-black uppercase text-[#06165b]" htmlFor={`phone-${jobPostingId ?? "general"}`}>Phone</label>
        <input id={`phone-${jobPostingId ?? "general"}`} name="phone" className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#06165b] focus:ring-2 focus:ring-[#42d6d0]/40" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-black uppercase text-[#06165b]" htmlFor={`coverLetter-${jobPostingId ?? "general"}`}>Experience and role fit</label>
        <textarea id={`coverLetter-${jobPostingId ?? "general"}`} required name="coverLetter" rows={compact ? 4 : 5} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-[#06165b] focus:ring-2 focus:ring-[#42d6d0]/40" />
      </div>
      <div className="flex flex-col items-start gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending} className="bg-[#cf1017] text-white hover:bg-[#b20d13]">
          <Send className="size-4" aria-hidden />
          {pending ? "Submitting..." : "Submit application"}
        </Button>
        {state.message ? <p className={`text-sm font-semibold ${state.ok ? "text-emerald-700" : "text-[#cf1017]"}`}>{state.message}</p> : null}
      </div>
    </form>
  );
}
