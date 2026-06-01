import type { ReactNode } from "react";

export function PageWrapper({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="font-heading text-2xl font-semibold text-[var(--portal-text)] sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm text-[var(--portal-muted)]">{description}</p> : null}
        </header>
        {children}
      </div>
    </main>
  );
}
