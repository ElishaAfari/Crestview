import { ExtraClassesPaymentsWorkspace } from "@/components/finance/ExtraClassesPaymentsWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function ExtraClassesPaymentsPage() {
  return <PageWrapper title="Extra Class Payments" description="Record and search extra-class collections."><ExtraClassesPaymentsWorkspace /></PageWrapper>;
}
