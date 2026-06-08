import { ArrowRight, Database, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { OperationsModule, OperationsWorkspace } from "@/config/operations";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WorkspaceWithCounts = Omit<OperationsWorkspace, "modules"> & { modules: Array<OperationsModule & { count: number }> };

export function RoleOperationsWorkspace({ workspace }: { workspace: WorkspaceWithCounts }) {
  return (
    <PageWrapper title={workspace.title} description={workspace.description}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workspace.modules.map((module) => (
          <Card key={module.key}>
            <CardContent className="p-5">
              <span className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20">
                <Database className="size-5" aria-hidden />
              </span>
              <p className="mt-5 text-sm font-bold text-[var(--portal-muted)]">{module.label}</p>
              <p className="mt-1 font-heading text-3xl font-black text-[var(--portal-text)]">{module.count}</p>
              <Link href={`/${workspace.key}/${module.key}`} className="mt-5 inline-flex items-center gap-1 text-xs font-black text-blue-700 hover:text-blue-900 dark:text-blue-200">Open register <ArrowRight className="size-3.5" aria-hidden /></Link>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardHeader><CardTitle>Role workspace</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {workspace.modules.map((module) => (
            <Link key={module.key} href={`/${workspace.key}/${module.key}`} className="rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-4 transition hover:border-blue-200 hover:bg-blue-50/70 dark:hover:bg-blue-500/10">
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-300" aria-hidden /><p className="text-sm font-black text-[var(--portal-text)]">{module.label}</p></div>
              <p className="mt-2 text-xs leading-5 text-[var(--portal-muted)]">{module.description}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
