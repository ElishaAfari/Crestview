import { FinanceChart } from "@/components/charts/FinanceChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { InvoiceTable } from "@/components/tables/InvoiceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listFamilyInvoices } from "@/features/dashboard/queries";

export default async function ParentFeesPage() {
  const invoices = await listFamilyInvoices();

  return (
    <PageWrapper title="Fees" description="Family invoices, payments, and due dates.">
      <Card><CardHeader><CardTitle>Payment History</CardTitle></CardHeader><CardContent><FinanceChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Family Invoices</CardTitle></CardHeader><CardContent><InvoiceTable data={invoices} /></CardContent></Card>
    </PageWrapper>
  );
}
