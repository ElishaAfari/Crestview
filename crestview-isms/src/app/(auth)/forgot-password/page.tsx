import { ArrowLeft, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { siteConfig } from "@/config/site";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-4 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#06165b] hover:text-[#cf1017]"><ArrowLeft className="size-4" aria-hidden />Back to sign in</Link>
        <Image src="/crestview-logo.png" alt="Crestview International School" width={72} height={72} className="mt-8 size-16 object-contain" />
        <h1 className="mt-6 font-heading text-3xl font-black text-[#06165b]">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Enter the email address linked to your school account.</p>
        <div className="mt-7"><ForgotPasswordForm /></div>
        <a href={siteConfig.phones[0].href} className="mt-8 flex items-center gap-2 border-t border-slate-200 pt-5 text-xs font-bold text-slate-500 hover:text-[#cf1017]"><Phone className="size-4" aria-hidden />Need help? Call {siteConfig.phones[0].label}</a>
      </section>
    </main>
  );
}
