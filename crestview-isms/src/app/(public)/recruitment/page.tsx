import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const jobs = [
  "Senior Mathematics Teacher",
  "Admissions Coordinator"
];

export default function RecruitmentPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl font-semibold text-white">Recruitment</h1>
      <p className="mt-3 text-slate-400">Open roles for educators and school operations professionals.</p>
      <div className="mt-8 grid gap-4">
        {jobs.map((job) => (
          <Card key={job}>
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <Briefcase className="size-5 text-blue-300" aria-hidden />
                <span className="font-medium text-slate-100">{job}</span>
              </div>
              <Badge tone="green">Open</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
