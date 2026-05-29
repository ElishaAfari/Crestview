import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentMessagesPage() {
  return (
    <PageWrapper title="Messages" description="Teacher and school communication.">
      <Card><CardHeader><CardTitle>Inbox</CardTitle></CardHeader><CardContent className="text-sm text-slate-400">No unread messages.</CardContent></Card>
    </PageWrapper>
  );
}
