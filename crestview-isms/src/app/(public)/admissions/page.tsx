import { CheckCircle2, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { AdmissionForm } from "@/components/forms/AdmissionForm";
import { siteConfig } from "@/config/site";

const steps = ["Share learner details", "Admissions review", "Plan the right start"];

export default function AdmissionsPage() {
  return (
    <main className="bg-[#f7f9fc] text-slate-950">
      <section className="bg-[#06165b] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase text-[#ffd83d]">Admission in progress</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-black leading-tight sm:text-6xl">Begin your child&apos;s Crestview journey.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100">
            Tell us a little about your child. Our admissions team will review your application and contact you about the next step.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.72fr] lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-heading text-2xl font-black text-[#06165b]">Application details</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Complete the form and we will follow up with you directly.</p>
          <div className="mt-7"><AdmissionForm /></div>
        </div>

        <aside className="space-y-5">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <Image src="/landing/crestview-admissions-flyer.jpeg" alt="Crestview International School admission flyer" width={1000} height={750} className="h-auto w-full" />
          </div>
          <div className="rounded-lg bg-[#eaf8f7] p-6">
            <h2 className="font-heading text-xl font-black text-[#06165b]">What happens next</h2>
            <div className="mt-4 grid gap-3">
              {steps.map((step) => <p key={step} className="flex items-center gap-2 text-sm font-bold text-slate-700"><CheckCircle2 className="size-4 text-[#cf1017]" aria-hidden />{step}</p>)}
            </div>
          </div>
          <div className="rounded-lg bg-[#cf1017] p-6 text-white">
            <p className="flex items-start gap-2 text-sm font-bold"><MapPin className="mt-0.5 size-4 shrink-0 text-[#ffd83d]" aria-hidden />{siteConfig.address}</p>
            <a href={siteConfig.phones[0].href} className="mt-3 flex items-center gap-2 text-sm font-bold transition hover:text-[#ffd83d]"><Phone className="size-4 text-[#ffd83d]" aria-hidden />{siteConfig.phones[0].label}</a>
          </div>
        </aside>
      </section>
    </main>
  );
}
