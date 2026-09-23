import { PageWrapper } from "@/components/layout/PageWrapper";
import { TransportFareWorkspace } from "@/components/transport/TransportFareWorkspace";

export default function TransportFaresPage() {
  return <PageWrapper title="Transport Fares" description="Set route fares and collect payment by QR-scanned card or student ID."><TransportFareWorkspace /></PageWrapper>;
}
