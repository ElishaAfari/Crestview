import { AITutorChat } from "@/components/ai/AITutorChat";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentAiTutorPage() {
  return (
    <PageWrapper title="AI Tutor" description="Guided academic support that asks useful questions instead of giving away answers.">
      <Card><CardHeader><CardTitle>Tutor Chat</CardTitle></CardHeader><CardContent><AITutorChat /></CardContent></Card>
    </PageWrapper>
  );
}
