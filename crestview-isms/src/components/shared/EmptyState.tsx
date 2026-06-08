import { Inbox } from "lucide-react";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="portal-subtle-card flex min-h-48 flex-col items-center justify-center rounded-xl border-dashed p-8 text-center">
      <Inbox className="portal-icon-tile portal-tone-blue mb-3 size-12 rounded-lg p-3" aria-hidden />
      <h3 className="font-heading text-base font-black text-[var(--portal-text)]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm font-semibold text-[var(--portal-muted)]">{message}</p>
    </div>
  );
}
