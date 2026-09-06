import Link from "next/link";
import { ArrowRight, Banknote, ClipboardList, FileText, Settings2 } from "lucide-react";
import { listDailyFeePayments, listDailyFeePlans, listInvoices } from "@/features/admin/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function amount(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function FinanceOverview() {
  const [payments, plans, invoices] = await Promise.all([listDailyFeePayments(), listDailyFeePlans(), listInvoices()]);
  const today = new Date().toISOString().slice(0, 10);
  const collected = payments.filter((payment) => payment.status === "paid" || payment.status === "waived").reduce((sum, payment) => sum + amount(payment.amount), 0);
  const todayCollected = payments.filter((payment) => payment.paymentDate === today && payment.status === "paid").reduce((sum, payment) => sum + amount(payment.amount), 0);
  const outstanding = invoices.filter((invoice) => ["draft", "open", "overdue"].includes(invoice.status)).reduce((sum, invoice) => sum + amount(invoice.amount), 0);
  const overdue = invoices.filter((invoice) => invoice.status === "overdue").length;

  const actions = [
    { href: "/finance/fee-structures", label: "Fee structures", description: "Manage class daily fee plans", icon: Settings2 },
    { href: "/finance/payments", label: "Payments", description: "Record and search collections", icon: Banknote },
    { href: "/finance/invoices", label: "Invoices", description: "Create and follow up invoices", icon: FileText },
    { href: "/finance/collections", label: "Collections", description: "Review collection activity", icon: ClipboardList }
  ];

  return (
    <div className="reference-workspace space-y-6">
      <section className="ref-stats">
        {[
          ["Daily fees collected", money(collected), "All paid and waived daily records"],
          ["Collected today", money(todayCollected), "Confirmed paid records for today"],
          ["Outstanding invoices", money(outstanding), `${invoices.filter((invoice) => ["draft", "open", "overdue"].includes(invoice.status)).length} open records`],
          ["Overdue invoices", overdue.toString(), "Needs finance follow-up"]
        ].map(([label, value, note]) => (
          <div className="ref-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <p>{note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map(({ href, label, description, icon: Icon }) => (
          <Link href={href} key={href} className="ref-panel group block transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <span className="ref-avatar"><Icon className="size-5" aria-hidden /></span>
              <ArrowRight className="size-4 text-[var(--portal-muted)] transition group-hover:translate-x-1" aria-hidden />
            </div>
            <h2 className="mt-4 text-base font-black text-[var(--portal-text)]">{label}</h2>
            <p className="mt-1 text-sm">{description}</p>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Active class fee plans</CardTitle>
          <p className="text-sm font-semibold text-[var(--portal-muted)]">Daily fees are resolved from the student&apos;s current class at capture time.</p>
        </CardHeader>
        <CardContent>
          {plans.length ? (
            <div className="ref-table-scroll">
              <table className="ref-table">
                <thead><tr><th>Class</th><th>Amount</th><th>Effective from</th><th>Status</th></tr></thead>
                <tbody>{plans.slice(0, 8).map((plan) => <tr key={plan.id}><td>{plan.className}</td><td>{plan.amount}</td><td>{plan.effectiveFrom}</td><td><span className={`ref-status ref-status-${plan.status}`}>{plan.status}</span></td></tr>)}</tbody>
              </table>
            </div>
          ) : <p className="text-sm font-semibold text-[var(--portal-muted)]">No class fee plans have been configured yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
