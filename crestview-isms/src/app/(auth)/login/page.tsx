import { ArrowLeft, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";
import { siteConfig } from "@/config/site";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-white text-slate-950 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#06165b] lg:block">
        <Image src="/landing/programmes/robotics-lab.png" alt="Crestview students learning robotics" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06165b] via-[#06165b]/45 to-[#06165b]/10" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-xs font-black uppercase text-[#ffd83d]">{siteConfig.motto}</p>
          <h1 className="mt-3 max-w-xl font-heading text-5xl font-black leading-tight">Welcome back to Crestview.</h1>
          <p className="mt-4 max-w-lg leading-7 text-blue-100">Sign in to reach your school workspace, tools, and updates.</p>
        </div>
      </section>
      <section className="flex items-center px-4 py-12 sm:px-8 lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#06165b] hover:text-[#cf1017]"><ArrowLeft className="size-4" aria-hidden />Back to school website</Link>
          <div className="mt-8 flex items-center gap-3">
            <Image src="/crestview-logo.png" alt="Crestview International School" width={72} height={72} className="size-16 object-contain" />
            <div><p className="font-heading text-xl font-black uppercase text-[#06165b]">Crestview</p><p className="text-xs font-black uppercase text-[#cf1017]">International School</p></div>
          </div>
          <h2 className="mt-9 font-heading text-3xl font-black text-[#06165b]">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use the account details issued to you by the school.</p>
          <div className="mt-7"><LoginForm /></div>
          <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm font-bold">
            <Link href="/forgot-password" className="text-[#082b91] hover:text-[#cf1017]">Forgot password</Link>
            <Link href="/register" className="text-[#082b91] hover:text-[#cf1017]">Account access</Link>
          </div>
          <a href={siteConfig.phones[0].href} className="mt-10 flex items-center gap-2 border-t border-slate-200 pt-5 text-xs font-bold text-slate-500 hover:text-[#cf1017]"><Phone className="size-4" aria-hidden />Need help? Call {siteConfig.phones[0].label}</a>
        </div>
      </section>
    </main>
  );
}
