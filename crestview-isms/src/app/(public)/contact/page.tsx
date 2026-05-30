import { MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { siteConfig } from "@/config/site";

export default function ContactPage() {
  return (
    <main className="bg-[#f7f9fc] text-slate-950">
      <section className="bg-[#06165b] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase text-[#42d6d0]">Visit or get in touch</p>
          <h1 className="mt-3 font-heading text-4xl font-black sm:text-6xl">Contact Crestview.</h1>
          <p className="mt-5 max-w-2xl leading-7 text-blue-100">Ask a question, arrange a visit, or speak with the team about enrollment.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.2fr] lg:px-8">
        <div className="grid gap-4">
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.address)}`} target="_blank" rel="noreferrer" className="rounded-lg bg-[#eaf8f7] p-6 transition hover:bg-[#d7f3f1]">
            <MapPin className="size-6 text-[#cf1017]" aria-hidden />
            <p className="mt-4 text-xs font-black uppercase text-[#06165b]">Find us</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{siteConfig.address}</p>
          </a>
          <div className="rounded-lg bg-[#ffd83d] p-6">
            <Phone className="size-6 text-[#cf1017]" aria-hidden />
            <p className="mt-4 text-xs font-black uppercase text-[#06165b]">Call admissions</p>
            <div className="mt-2 grid gap-2">
              {siteConfig.phones.map((phone) => <a key={phone.href} href={phone.href} className="text-sm font-black text-[#06165b] transition hover:text-[#cf1017]">{phone.label}</a>)}
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-heading text-2xl font-black text-[#06165b]">Send a message</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">We will respond using the contact details you provide.</p>
          <div className="mt-7"><ContactForm /></div>
        </div>
      </section>
    </main>
  );
}
