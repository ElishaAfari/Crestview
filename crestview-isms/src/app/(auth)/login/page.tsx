import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Sign in</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div><Label>Email</Label><Input type="email" defaultValue="admin@crestview.edu" /></div>
            <div><Label>Password</Label><Input type="password" defaultValue="Admin@123" /></div>
            <Button type="submit">Open workspace</Button>
          </form>
          <div className="mt-4 flex justify-between text-sm text-slate-400">
            <Link href="/forgot-password" className="hover:text-white">Forgot password</Link>
            <Link href="/register" className="hover:text-white">Create account</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
