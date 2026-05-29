import { Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl font-semibold text-white">Contact</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><MapPin className="size-5 text-blue-300" /><p className="mt-3 text-sm text-slate-300">Crestview Avenue, International District</p></CardContent></Card>
        <Card><CardContent className="p-5"><Mail className="size-5 text-blue-300" /><p className="mt-3 text-sm text-slate-300">hello@crestview.edu</p></CardContent></Card>
        <Card><CardContent className="p-5"><Phone className="size-5 text-blue-300" /><p className="mt-3 text-sm text-slate-300">+1 000 000 0000</p></CardContent></Card>
      </div>
    </main>
  );
}
