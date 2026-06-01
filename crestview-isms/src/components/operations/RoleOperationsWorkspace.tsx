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
              <Database className="size-5 text-blue-300" aria-hidden />
              <p className="mt-5 text-sm text-slate-400">{module.label}</p>
              <p className="mt-1 font-heading text-3xl font-semibold text-white">{module.count}</p>
              <Link href={`/${workspace.key}/${module.key}`} className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-blue-300 hover:text-white">Open register <ArrowRight className="size-3.5" aria-hidden /></Link>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardHeader><CardTitle>Role workspace</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {workspace.modules.map((module) => (
            <Link key={module.key} href={`/${workspace.key}/${module.key}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.07]">
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-300" aria-hidden /><p className="text-sm font-semibold text-slate-100">{module.label}</p></div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{module.description}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
