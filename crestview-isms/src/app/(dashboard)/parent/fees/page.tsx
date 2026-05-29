import { FinanceChart } from "@/components/charts/FinanceChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentFeesPage() {
  return (
    <PageWrapper title="Fees" description="Family invoices, payments, and due dates.">
      <Card><CardHeader><CardTitle>Payment History</CardTitle></CardHeader><CardContent><FinanceChart /></CardContent></Card>
    </PageWrapper>
  );
}
