import { FinanceChart } from "@/components/charts/FinanceChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { DailyFeePaymentTable } from "@/components/tables/DailyFeePaymentTable";
import { InvoiceTable } from "@/components/tables/InvoiceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listFamilyDailyFeePayments, listFamilyInvoices } from "@/features/dashboard/queries";

function amountValue(value: string) {
  const amount = Number(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function familyFinanceSeries(payments: Array<{ paymentDate: string; amount: string; status: string }>) {
  const monthSeeds = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      month: new Intl.DateTimeFormat("en-GH", { month: "short" }).format(date),
      collected: 0,
      pending: 0
    };
  });
  const byMonth = new Map(monthSeeds.map((item) => [item.key, item]));
  for (const payment of payments) {
    const date = new Date(payment.paymentDate);
    const bucket = byMonth.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    if (bucket && (payment.status === "paid" || payment.status === "waived")) bucket.collected += amountValue(payment.amount);
  }
  return Array.from(byMonth.values()).map(({ month, collected, pending }) => ({ month, collected, pending }));
}

export default async function ParentFeesPage() {
  const [dailyPayments, invoices] = await Promise.all([listFamilyDailyFeePayments(), listFamilyInvoices()]);

  return (
    <PageWrapper title="Fees" description="Daily fee receipts, payment history, and special invoices for your child.">
      <Card><CardHeader><CardTitle>Payment History</CardTitle></CardHeader><CardContent><FinanceChart data={familyFinanceSeries(dailyPayments)} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Daily Fee Receipts</CardTitle></CardHeader><CardContent><DailyFeePaymentTable data={dailyPayments} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Special Invoices</CardTitle></CardHeader><CardContent><InvoiceTable data={invoices} /></CardContent></Card>
    </PageWrapper>
  );
}
