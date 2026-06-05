import { Inbox } from "lucide-react";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--portal-border)] p-8 text-center">
      <Inbox className="mb-3 size-8 text-[var(--portal-muted)]" aria-hidden />
      <h3 className="font-heading text-base font-semibold text-[var(--portal-text)]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--portal-muted)]">{message}</p>
    </div>
  );
}
