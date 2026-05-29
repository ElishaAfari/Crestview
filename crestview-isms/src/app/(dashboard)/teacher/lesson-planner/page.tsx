import { AILessonPlanner } from "@/components/ai/AILessonPlanner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherLessonPlannerPage() {
  return (
    <PageWrapper title="AI Lesson Planner" description="Generate structured lesson plans for review and adaptation.">
      <Card><CardHeader><CardTitle>Planner</CardTitle></CardHeader><CardContent><AILessonPlanner /></CardContent></Card>
    </PageWrapper>
  );
}
