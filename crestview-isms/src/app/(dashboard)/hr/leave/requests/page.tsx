import { HrLeaveWorkspace } from "@/components/hr/HrLeaveWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function HrLeaveRequestsPage() {
  return <PageWrapper title="Leave Requests" description="Review and manage staff leave requests."><HrLeaveWorkspace /></PageWrapper>;
}
