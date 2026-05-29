import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MfaSetupPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Multi-factor authentication</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ShieldCheck className="size-10 text-blue-300" aria-hidden />
          <p className="text-sm leading-6 text-slate-400">Protect staff and admin accounts with a second verification step.</p>
          <Button type="button">Begin setup</Button>
        </CardContent>
      </Card>
    </main>
  );
}
