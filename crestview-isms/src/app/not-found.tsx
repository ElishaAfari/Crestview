import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md rounded-xl border border-white/10 bg-slate-900 p-6 text-center">
        <h1 className="font-heading text-xl font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">The Crestview page you requested does not exist.</p>
        <Link href="/" className={buttonVariants({ className: "mt-5" })}>Return home</Link>
      </div>
    </main>
  );
}
