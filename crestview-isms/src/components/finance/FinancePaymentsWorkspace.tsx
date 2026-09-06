import Link from "next/link";
import { ArrowLeft, Banknote, CalendarDays, CircleDollarSign, ReceiptText } from "lucide-react";
import { DailyFeePaymentForm } from "@/components/forms/DailyFeePaymentForm";
import { DailyFeePaymentTable } from "@/components/tables/DailyFeePaymentTable";
import { listDailyFeePayments } from "@/features/admin/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function amount(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function FinancePaymentsWorkspace() {
  const payments = await listDailyFeePayments();
  const today = new Date().toISOString().slice(0, 10);
  const paid = payments.filter((payment) => payment.status === "paid");
  const collected = paid.reduce((sum, payment) => sum + amount(payment.amount), 0);
  const todayPayments = paid.filter((payment) => payment.paymentDate === today);
  const cash = paid.filter((payment) => payment.method === "cash").reduce((sum, payment) => sum + amount(payment.amount), 0);
  const mobile = paid.filter((payment) => payment.method === "mobile money").reduce((sum, payment) => sum + amount(payment.amount), 0);
  const todayAmount = todayPayments.reduce((sum, payment) => sum + amount(payment.amount), 0);

  return (
    <div className="reference-workspace space-y-6">
      <div className="ref-actions">
        <Link className="ref-button ref-button-secondary" href="/finance"><ArrowLeft className="size-4" aria-hidden />Finance overview</Link>
        <a className="ref-button ref-primary" href="#record-payment"><Banknote className="size-4" aria-hidden />Record payment</a>
      </div>
      <section className="ref-stats">
        {[
          { label: "Total collected", value: money(collected), note: `${paid.length} paid transactions`, icon: CircleDollarSign },
          { label: "Cash payments", value: money(cash), note: "Recorded as cash", icon: Banknote },
          { label: "Mobile money", value: money(mobile), note: "Recorded as mobile money", icon: ReceiptText },
          { label: "Today's collection", value: money(todayAmount), note: `${todayPayments.length} transactions`, icon: CalendarDays }
        ].map(({ label, value, note, icon: MetricIcon }) => {
          return <div className="ref-stat" key={label}><span>{label}</span><strong>{value}</strong><p>{note}</p><MetricIcon className="absolute right-4 top-4 size-5 text-[var(--portal-accent)]" aria-hidden /></div>;
        })}
      </section>
      <Card id="record-payment">
        <CardHeader><CardTitle>Record a payment</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Scan the student QR code or enter the eight-digit student ID. Duplicate records for the same student and date are protected.</p></CardHeader>
        <CardContent><DailyFeePaymentForm /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Payment register</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search by student, ID, class, date, payment method, or receipt reference.</p></CardHeader>
        <CardContent><DailyFeePaymentTable data={payments} /></CardContent>
      </Card>
    </div>
  );
}
