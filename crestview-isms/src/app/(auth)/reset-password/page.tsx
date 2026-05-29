import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Choose a new password</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div><Label>New password</Label><Input type="password" /></div>
            <div><Label>Confirm password</Label><Input type="password" /></div>
            <Button type="submit">Update password</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
