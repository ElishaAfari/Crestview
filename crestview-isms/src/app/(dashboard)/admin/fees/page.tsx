import { FinanceChart } from "@/components/charts/FinanceChart";
import { FeeForm } from "@/components/forms/FeeForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminFeesPage() {
  return (
    <PageWrapper title="Fees" description="Invoices, payment tracking, and finance operations.">
      <Card><CardHeader><CardTitle>Collection Rate</CardTitle></CardHeader><CardContent><FinanceChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Create Invoice</CardTitle></CardHeader><CardContent><FeeForm /></CardContent></Card>
    </PageWrapper>
  );
}
