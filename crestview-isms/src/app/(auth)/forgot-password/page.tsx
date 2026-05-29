import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Reset password</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div><Label>Email</Label><Input type="email" /></div>
            <Button type="submit">Send reset link</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
