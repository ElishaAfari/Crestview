import { Briefcase, CalendarDays, MapPin } from "lucide-react";
import { JobApplicationForm } from "@/components/forms/JobApplicationForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

type JobPosting = { id: string; title: string; employment_type: string; description: string; closes_on: string | null };

function labelEmploymentType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function RecruitmentPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("job_postings").select("id,title,employment_type,description,closes_on").eq("is_active", true).order("created_at", { ascending: false });
  const jobs = (data ?? []) as JobPosting[];

  return (
    <main className="bg-[#f7f9fc] text-slate-950">
      <section className="bg-[#06165b] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase text-[#42d6d0]">Join the team</p>
          <h1 className="mt-3 font-heading text-4xl font-black sm:text-6xl">Recruitment.</h1>
          <p className="mt-5 max-w-2xl leading-7 text-blue-100">Help build a warm, ambitious school community where children are known and inspired.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {jobs.length ? (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <article key={job.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Briefcase className="size-6 text-[#cf1017]" aria-hidden />
                    <h2 className="mt-4 font-heading text-2xl font-black text-[#06165b]">{job.title}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{job.description}</p>
                  </div>
                  <span className="w-fit rounded-full bg-[#eaf8f7] px-3 py-1 text-xs font-black text-[#06165b]">{labelEmploymentType(job.employment_type)}</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><MapPin className="size-4 text-[#cf1017]" aria-hidden />{siteConfig.address}</span>
                  {job.closes_on ? <span className="flex items-center gap-1.5"><CalendarDays className="size-4 text-[#cf1017]" aria-hidden />Applications close {job.closes_on}</span> : null}
                </div>
                <div className="mt-6 rounded-lg border border-slate-200 bg-[#f7f9fc] p-4">
                  <JobApplicationForm jobPostingId={job.id} compact />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="max-w-3xl">
              <Briefcase className="size-7 text-[#cf1017]" aria-hidden />
              <h2 className="mt-4 font-heading text-2xl font-black text-[#06165b]">Send a professional profile</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Teachers and future school staff can apply here for upcoming Crestview opportunities.</p>
            </div>
            <div className="mt-6">
              <JobApplicationForm />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
