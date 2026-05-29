import { CalendarWidget } from "@/components/dashboard/CalendarWidget";

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl font-semibold text-white">Events</h1>
      <p className="mt-3 text-slate-400">Upcoming school events, assessment windows, and family meetings.</p>
      <div className="mt-8"><CalendarWidget /></div>
    </main>
  );
}
