import { ArrowLeft, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-4 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#06165b] hover:text-[#cf1017]"><ArrowLeft className="size-4" aria-hidden />Back to sign in</Link>
        <Image src="/crestview-logo.png" alt="Crestview International School" width={72} height={72} className="mt-8 size-16 object-contain" />
        <ShieldCheck className="mt-6 size-7 text-[#cf1017]" aria-hidden />
        <h1 className="mt-4 font-heading text-3xl font-black text-[#06165b]">Account access</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">School portal accounts are issued by Crestview so each learner, guardian, and staff member receives the correct access level.</p>
        <a href={siteConfig.phones[0].href} className="mt-7 flex items-center justify-center gap-2 rounded-lg bg-[#cf1017] px-4 py-3 text-sm font-bold text-white hover:bg-[#ad0d13]"><Phone className="size-4" aria-hidden />Call {siteConfig.phones[0].label}</a>
      </section>
    </main>
  );
}
