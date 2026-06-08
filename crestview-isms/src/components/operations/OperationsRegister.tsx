import { ArrowLeft, Database } from "lucide-react";
import Link from "next/link";
import type { OperationsModule, OperationsWorkspace } from "@/config/operations";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function OperationsRegister({ workspace, module, records, count }: { workspace: OperationsWorkspace; module: OperationsModule; records: Array<Record<string, unknown>>; count: number }) {
  return (
    <PageWrapper title={module.label} description={module.description}>
      <Link href={`/${workspace.key}`} className="inline-flex items-center gap-1 text-sm font-black text-blue-700 hover:text-blue-900 dark:text-blue-200"><ArrowLeft className="size-4" aria-hidden />Back to {workspace.title}</Link>
      <Card>
        <CardHeader><CardTitle>{count} records</CardTitle></CardHeader>
        <CardContent>
          {records.length ? (
            <div className="overflow-x-auto rounded-lg border border-[var(--portal-border)]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--portal-surface-strong)] text-xs uppercase text-[var(--portal-muted)]"><tr>{module.fields.map((field) => <th key={field.key} className="px-4 py-3">{field.label}</th>)}</tr></thead>
                <tbody>
                  {records.map((record, index) => <tr key={String(record.id ?? index)} className="border-t border-[var(--portal-border)]">{module.fields.map((field) => <td key={field.key} className="max-w-72 truncate px-4 py-3 text-[var(--portal-text)]">{displayValue(record[field.key])}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-[var(--portal-border)] text-center">
              <div><Database className="mx-auto size-6 text-[var(--portal-muted)]" aria-hidden /><p className="mt-3 text-sm text-[var(--portal-muted)]">No records have been added yet.</p></div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
