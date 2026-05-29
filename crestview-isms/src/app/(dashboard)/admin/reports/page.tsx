import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminReportsPage() {
  return (
    <PageWrapper title="Reports" description="Generate academic, attendance, finance, and AI-supported student reports.">
      <AIInsightCard insight="Report generation combines computed grades, attendance, and AI narrative summaries for review before publishing." />
      <Card><CardHeader><CardTitle>Report Queue</CardTitle></CardHeader><CardContent className="text-sm text-slate-400">No reports are queued right now.</CardContent></Card>
    </PageWrapper>
  );
}
