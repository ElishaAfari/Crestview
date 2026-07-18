import { FinanceChart } from "@/components/charts/FinanceChart";
import { ClassInvoiceBatchForm } from "@/components/forms/ClassInvoiceBatchForm";
import { DailyFeePaymentForm } from "@/components/forms/DailyFeePaymentForm";
import { DailyFeePlanForm } from "@/components/forms/DailyFeePlanForm";
import { FeeForm } from "@/components/forms/FeeForm";
import { StudentIdCardGrid } from "@/components/students/StudentIdCardGrid";
import { DailyFeePaymentTable } from "@/components/tables/DailyFeePaymentTable";
import { DailyFeePlanTable } from "@/components/tables/DailyFeePlanTable";
import { InvoiceTable } from "@/components/tables/InvoiceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listDailyFeePayments, listDailyFeePlans, listFinanceFormOptions, listInvoices, listStudentIdCards } from "@/features/admin/queries";

type FinanceFocus = "full" | "payments" | "plans" | "cards" | "invoices" | "collections";

function amountValue(value: string) {
  const amount = Number(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GH", { month: "short" }).format(date);
}

function financeSeries(
  dailyPayments: Array<{ paymentDate: string; amount: string; status: string }>,
  invoices: Array<{ amount: string; status: string; dueDate: string }>
) {
  const monthSeeds = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, month: monthLabel(date), collected: 0, pending: 0 };
  });
  const byMonth = new Map(monthSeeds.map((item) => [item.key, item]));
  for (const payment of dailyPayments) {
    const date = new Date(payment.paymentDate);
    const bucket = byMonth.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    if (bucket && (payment.status === "paid" || payment.status === "waived")) bucket.collected += amountValue(payment.amount);
  }
  for (const invoice of invoices) {
    const date = new Date(invoice.dueDate);
    const bucket = byMonth.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    if (!bucket) continue;
    if (invoice.status === "paid") bucket.collected += amountValue(invoice.amount);
    else if (["draft", "open", "overdue"].includes(invoice.status)) bucket.pending += amountValue(invoice.amount);
  }
  return Array.from(byMonth.values()).map(({ month, collected, pending }) => ({ month, collected, pending }));
}

export async function FinanceFeesWorkspace({ focus = "full" }: { focus?: FinanceFocus }) {
  const [options, dailyPayments, dailyPlans, idCards, invoices] = await Promise.all([
    listFinanceFormOptions(),
    listDailyFeePayments(),
    listDailyFeePlans(),
    listStudentIdCards(),
    listInvoices()
  ]);
  const showPayments = focus === "full" || focus === "payments" || focus === "collections";
  const showPlans = focus === "full" || focus === "plans";
  const showCards = focus === "full" || focus === "cards" || focus === "payments";
  const showInvoices = focus === "full" || focus === "invoices" || focus === "collections";
  const chartData = financeSeries(dailyPayments, invoices);

  return (
    <>
      {focus === "full" || focus === "collections" ? (
        <Card><CardHeader><CardTitle>Collection Trend</CardTitle></CardHeader><CardContent><FinanceChart data={chartData} /></CardContent></Card>
      ) : null}
      {showPayments ? (
        <Card id="daily-payment">
          <CardHeader>
            <CardTitle>Daily Fee Capture</CardTitle>
            <p className="text-sm font-bold text-[var(--portal-muted)]">Scan a student ID card or type the student number to record the current day&apos;s daily fee.</p>
          </CardHeader>
          <CardContent><DailyFeePaymentForm /></CardContent>
        </Card>
      ) : null}
      {showPlans ? (
        <Card id="daily-fee-plans">
          <CardHeader>
            <CardTitle>Class Daily Fee Plans</CardTitle>
            <p className="text-sm font-bold text-[var(--portal-muted)]">Set the daily amount for each class. Finance uses this automatically unless an amount override is entered.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <DailyFeePlanForm classrooms={options.classrooms} />
            <DailyFeePlanTable data={dailyPlans} />
          </CardContent>
        </Card>
      ) : null}
      {showPayments ? (
        <Card>
          <CardHeader><CardTitle>Daily Payment Register</CardTitle></CardHeader>
          <CardContent><DailyFeePaymentTable data={dailyPayments} /></CardContent>
        </Card>
      ) : null}
      {showCards ? (
        <Card id="student-id-cards">
          <CardHeader>
            <CardTitle>Student QR ID Cards</CardTitle>
            <p className="text-sm font-bold text-[var(--portal-muted)]">The same QR code is used by finance for daily fees and by teachers for attendance.</p>
          </CardHeader>
          <CardContent><StudentIdCardGrid cards={idCards} /></CardContent>
        </Card>
      ) : null}
      {showInvoices ? (
        <Card><CardHeader><CardTitle>Exceptional Invoice Register</CardTitle></CardHeader><CardContent><InvoiceTable data={invoices} showControls /></CardContent></Card>
      ) : null}
      {focus === "full" || focus === "plans" ? (
        <Card id="class-billing"><CardHeader><CardTitle>Special Class Billing Batch</CardTitle></CardHeader><CardContent><ClassInvoiceBatchForm classrooms={options.classrooms} /></CardContent></Card>
      ) : null}
      {focus === "full" || focus === "invoices" ? (
        <Card id="create-invoice"><CardHeader><CardTitle>Create Special Invoice</CardTitle></CardHeader><CardContent><FeeForm students={options.students} /></CardContent></Card>
      ) : null}
    </>
  );
}
