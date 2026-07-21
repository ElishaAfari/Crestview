import Link from "next/link";
import { ArrowLeft, Download, FileCheck2, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { ReportDetail } from "@/features/reports/queries";
import { cn } from "@/lib/utils";

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="portal-subtle-card rounded-lg p-4">
      <h3 className="font-heading text-base font-black text-[var(--portal-text)]">{title}</h3>
      <ul className="mt-3 space-y-2">
        {(items.length ? items : ["No item recorded."]).map((item) => (
          <li key={item} className="text-sm font-semibold leading-6 text-[var(--portal-muted)]">- {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ReportDetailView({ report, backHref }: { report: ReportDetail; backHref: string }) {
  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-black text-blue-800 hover:text-blue-950 dark:text-blue-200">
        <ArrowLeft className="size-4" aria-hidden />Back to reports
      </Link>

      <Card className="portal-accent-blue overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-heading text-3xl font-black text-[var(--portal-text)]">End of Term Academic Report</h2>
                <StatusBadge status={report.status} />
              </div>
              <p className="mt-2 text-sm font-bold text-[var(--portal-muted)]">{report.student} | {report.studentNumber} | {report.classroom}</p>
              <p className="mt-1 text-sm font-bold text-[var(--portal-muted)]">{report.academicYear} | {report.term} | Published {report.publishedAt}</p>
            </div>
            <a className={cn(buttonVariants({ variant: "default" }), "w-fit")} href={report.downloadUrl} target="_blank" rel="noreferrer">
              <Download className="size-4" aria-hidden />Download PDF
            </a>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="portal-metric-card portal-accent-blue">
          <CardContent className="p-5">
            <p className="text-sm font-black text-[var(--portal-muted)]">Class Position</p>
            <p className="mt-2 font-heading text-4xl font-black text-[var(--portal-text)]">{report.positionLabel}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-[var(--portal-muted)]">
              {report.classSize ? `Out of ${report.classSize}` : "Class rank pending"}
            </p>
          </CardContent>
        </Card>
        <Card className="portal-metric-card portal-accent-green">
          <CardContent className="p-5">
            <p className="text-sm font-black text-[var(--portal-muted)]">Average</p>
            <p className="mt-2 font-heading text-4xl font-black text-[var(--portal-text)]">{Math.round(report.analysis.average)}%</p>
          </CardContent>
        </Card>
        <Card className="portal-metric-card portal-accent-amber">
          <CardContent className="p-5">
            <p className="text-sm font-black text-[var(--portal-muted)]">Total Marks</p>
            <p className="mt-2 font-heading text-4xl font-black text-[var(--portal-text)]">{report.totalMarks.toFixed(1)}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-[var(--portal-muted)]">{report.rankedSubjects} ranked subjects</p>
          </CardContent>
        </Card>
        <Card className="portal-metric-card portal-accent-red">
          <CardContent className="p-5">
            <p className="text-sm font-black text-[var(--portal-muted)]">Attendance</p>
            <p className="mt-2 font-heading text-4xl font-black text-[var(--portal-text)]">{Math.round(report.attendance.rate)}%</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCheck2 className="size-5 text-blue-700 dark:text-blue-200" aria-hidden />
            <CardTitle>Teacher Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-semibold leading-7 text-[var(--portal-muted)]">{report.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-emerald-700 dark:text-emerald-200" aria-hidden />
            <CardTitle>Subject Results</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-[var(--portal-muted)]">{report.rankingBasis}</p>
          <div className="portal-table-wrap portal-table-compact">
            <table className="w-full text-left text-sm">
              <thead className="portal-table-head text-xs uppercase">
                <tr>
                  {["Subject", "Assignment /10", "Quiz /10", "Midterm /10", "CA /30", "Exam /70", "Total /100", "Grade", "Remark", "Teacher comment"].map((header) => <th key={header} className="px-4 py-3 font-black">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {report.gradeRows.map((row) => (
                  <tr key={`${row.subject}-${row.total}`} className="portal-table-row">
                    <td className="px-4 py-3 font-black text-[var(--portal-text)]">{row.subject}</td>
                    <td className="px-4 py-3 font-bold text-[var(--portal-text)]">{row.assignment.toFixed(1)}</td>
                    <td className="px-4 py-3 font-bold text-[var(--portal-text)]">{row.quiz.toFixed(1)}</td>
                    <td className="px-4 py-3 font-bold text-[var(--portal-text)]">{row.midterm.toFixed(1)}</td>
                    <td className="px-4 py-3 font-bold text-[var(--portal-text)]">{row.classAssessment.toFixed(1)}</td>
                    <td className="px-4 py-3 font-bold text-[var(--portal-text)]">{row.exam.toFixed(1)}</td>
                    <td className="px-4 py-3 font-black text-[var(--portal-text)]">{row.total.toFixed(1)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.gradeCode} /></td>
                    <td className="px-4 py-3 font-bold text-[var(--portal-text)]">{row.remark}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--portal-muted)]">{row.comments || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-3">
        <ListBlock title="Strengths" items={report.analysis.strengths} />
        <ListBlock title="Areas To Improve" items={report.analysis.concerns} />
        <ListBlock title="Recommendations" items={report.analysis.recommendations} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card><CardHeader><CardTitle>Attitude</CardTitle></CardHeader><CardContent><p className="text-sm font-semibold leading-6 text-[var(--portal-muted)]">{report.analysis.attitude}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Punctuality</CardTitle></CardHeader><CardContent><p className="text-sm font-semibold leading-6 text-[var(--portal-muted)]">{report.analysis.punctuality}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Next Steps</CardTitle></CardHeader><CardContent><p className="text-sm font-semibold leading-6 text-[var(--portal-muted)]">{report.analysis.nextSteps}</p></CardContent></Card>
      </section>
    </div>
  );
}
