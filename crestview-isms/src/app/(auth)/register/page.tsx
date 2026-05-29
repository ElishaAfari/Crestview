import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader><CardTitle>Create account</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2">
            <div><Label>First name</Label><Input /></div>
            <div><Label>Last name</Label><Input /></div>
            <div className="sm:col-span-2"><Label>Email</Label><Input type="email" /></div>
            <div className="sm:col-span-2"><Label>Password</Label><Input type="password" /></div>
            <Button type="submit" className="sm:col-span-2">Create account</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
