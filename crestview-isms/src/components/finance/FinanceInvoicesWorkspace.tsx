import Link from "next/link";
import { ArrowLeft, FilePlus2, Layers3, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassInvoiceBatchForm } from "@/components/forms/ClassInvoiceBatchForm";
import { FeeForm } from "@/components/forms/FeeForm";
import { InvoiceTable } from "@/components/tables/InvoiceTable";
import { listFinanceFormOptions, listInvoices } from "@/features/admin/queries";

function amount(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function FinanceInvoicesWorkspace() {
  const [invoices, options] = await Promise.all([listInvoices(), listFinanceFormOptions()]);
  const total = invoices.reduce((sum, invoice) => sum + amount(invoice.amount), 0);
  const collected = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + amount(invoice.amount), 0);
  const outstanding = invoices.filter((invoice) => ["draft", "open", "overdue"].includes(invoice.status)).reduce((sum, invoice) => sum + amount(invoice.amount), 0);
  const overdue = invoices.filter((invoice) => invoice.status === "overdue").length;

  return (
    <div className="reference-workspace space-y-6">
      <div className="ref-actions">
        <Link className="ref-button ref-button-secondary" href="/finance"><ArrowLeft className="size-4" aria-hidden />Finance overview</Link>
        <a className="ref-button ref-primary" href="#generate-invoices"><FilePlus2 className="size-4" aria-hidden />Generate invoices</a>
      </div>
      <section className="ref-stats">
        <div className="ref-stat"><span>Total invoiced</span><strong>{money(total)}</strong><p>{invoices.length} invoices</p><ReceiptText className="absolute right-4 top-4 size-5 text-[var(--portal-accent)]" aria-hidden /></div>
        <div className="ref-stat"><span>Collected</span><strong>{money(collected)}</strong><p>{total ? `${Math.round((collected / total) * 100)}% collection rate` : "No billing yet"}</p></div>
        <div className="ref-stat"><span>Outstanding</span><strong>{money(outstanding)}</strong><p>Pending payment</p></div>
        <div className="ref-stat"><span>Overdue</span><strong>{overdue}</strong><p>Invoices overdue</p><Layers3 className="absolute right-4 top-4 size-5 text-[var(--portal-accent)]" aria-hidden /></div>
      </section>
      <Card>
        <CardHeader><CardTitle>Invoice register</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search by invoice, student, amount, due date, or status. Controls update the underlying invoice lifecycle and guardian notifications.</p></CardHeader>
        <CardContent><InvoiceTable data={invoices} showControls /></CardContent>
      </Card>
      <section id="generate-invoices" className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Generate class invoices</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Broadcast a single charge to every active student in a class.</p></CardHeader><CardContent><ClassInvoiceBatchForm classrooms={options.classrooms} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Issue individual invoice</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Create a targeted invoice for one student and notify linked guardians.</p></CardHeader><CardContent><FeeForm students={options.students} /></CardContent></Card>
      </section>
    </div>
  );
}
