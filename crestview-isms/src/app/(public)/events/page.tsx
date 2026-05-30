import { CalendarDays, MapPin } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SchoolEvent = { id: string; title: string; description: string | null; location: string | null; starts_at: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GH", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function EventsPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("events").select("id,title,description,location,starts_at").neq("status", "cancelled").order("starts_at", { ascending: true });
  const events = (data ?? []) as SchoolEvent[];

  return (
    <main className="bg-[#f7f9fc] text-slate-950">
      <section className="bg-[#06165b] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase text-[#42d6d0]">School calendar</p>
          <h1 className="mt-3 font-heading text-4xl font-black sm:text-6xl">Events.</h1>
          <p className="mt-5 max-w-2xl leading-7 text-blue-100">Important moments for learners, families, and the Crestview community.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {events.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <article key={event.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase text-[#cf1017]">{formatDate(event.starts_at)}</p>
                <h2 className="mt-3 font-heading text-xl font-black text-[#06165b]">{event.title}</h2>
                {event.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{event.description}</p> : null}
                {event.location ? <p className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-500"><MapPin className="size-4 text-[#cf1017]" aria-hidden />{event.location}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <CalendarDays className="mx-auto size-7 text-[#cf1017]" aria-hidden />
            <h2 className="mt-4 font-heading text-2xl font-black text-[#06165b]">Calendar updates are on the way</h2>
            <p className="mt-2 text-sm text-slate-600">Public school events will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
