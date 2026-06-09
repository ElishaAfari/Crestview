import { FinanceChart } from "@/components/charts/FinanceChart";
import { ClassInvoiceBatchForm } from "@/components/forms/ClassInvoiceBatchForm";
import { FeeForm } from "@/components/forms/FeeForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { InvoiceTable } from "@/components/tables/InvoiceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminFormOptions, listInvoices } from "@/features/admin/queries";

export default async function AdminFeesPage() {
  const [options, invoices] = await Promise.all([listAdminFormOptions(), listInvoices()]);
  return (
    <PageWrapper title="Fees" description="Invoices, payment tracking, and finance operations.">
      <Card><CardHeader><CardTitle>Collection Rate</CardTitle></CardHeader><CardContent><FinanceChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Invoice Register</CardTitle></CardHeader><CardContent><InvoiceTable data={invoices} /></CardContent></Card>
      <Card id="class-billing"><CardHeader><CardTitle>Class Billing Batch</CardTitle></CardHeader><CardContent><ClassInvoiceBatchForm classrooms={options.classrooms} /></CardContent></Card>
      <Card id="create-invoice"><CardHeader><CardTitle>Create Invoice</CardTitle></CardHeader><CardContent><FeeForm students={options.students} /></CardContent></Card>
    </PageWrapper>
  );
}
