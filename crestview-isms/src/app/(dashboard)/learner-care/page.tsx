import { LearnerCareOverview } from "@/components/learner-care/LearnerCareOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function LearnerCarePage() {
  return <PageWrapper title="Learner Care" description="Coordinate wellbeing, behaviour, safeguarding, medical notes, interventions, and Student 360 follow-up."><LearnerCareOverview /></PageWrapper>;
}
