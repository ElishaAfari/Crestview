import type { ReactNode } from "react";

export function PageWrapper({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen flex-1 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.13),transparent_32rem),var(--portal-bg)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[92rem] space-y-6">
        <header className="rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] px-5 py-4 shadow-[var(--portal-card-shadow)]">
          <h1 className="font-heading text-2xl font-black tracking-normal text-[var(--portal-text)] sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--portal-muted)]">{description}</p> : null}
        </header>
        {children}
      </div>
    </main>
  );
}
