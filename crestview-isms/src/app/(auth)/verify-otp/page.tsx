import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyOtpPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Verify code</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div><Label>One-time code</Label><Input inputMode="numeric" /></div>
            <Button type="submit">Verify</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
