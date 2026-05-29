import { Inbox } from "lucide-react";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-8 text-center">
      <Inbox className="mb-3 size-8 text-slate-500" aria-hidden />
      <h3 className="font-heading text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>
    </div>
  );
}
