import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowLeft, BookOpenCheck, CalendarCheck2, CreditCard, FileText, ShieldCheck, Users } from "lucide-react";
import { Student360NoteForm } from "@/components/student-360/Student360NoteForm";
import { InvoiceTable } from "@/components/tables/InvoiceTable";
import { ReportTable } from "@/components/tables/ReportTable";
import { WorkflowTaskTable } from "@/components/tables/WorkflowTaskTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Student360Detail } from "@/features/automation/queries";

function MetricCard({ label, value, tone, icon: Icon }: { label: string; value: string | number; tone: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> }) {
  const iconTone = tone.replace("portal-accent", "portal-tone");

  return (
    <Card className={`portal-metric-card ${tone} overflow-hidden`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-[var(--portal-muted)]">{label}</p>
            <p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{value}</p>
          </div>
          <span className={`portal-icon-tile ${iconTone} size-12 rounded-lg`}>
            <Icon className="size-5" aria-hidden />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleGridTable({
  headers,
  rows
}: {
  headers: string[];
  rows: Array<Array<string | number | ReactNode>>;
}) {
  return rows.length ? (
    <div className="portal-table-wrap portal-table-compact">
      <table className="w-full text-left text-sm">
        <thead className="portal-table-head text-xs uppercase">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-black">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="portal-table-row">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 font-bold text-[var(--portal-text)]">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="portal-subtle-card rounded-lg p-4 text-sm font-bold text-[var(--portal-muted)]">No records have been captured yet.</div>
  );
}

export function Student360DetailView({
  detail,
  backHref,
  reportBasePath,
  canManageFinance = false
}: {
  detail: Student360Detail;
  backHref: string;
  reportBasePath: string;
  canManageFinance?: boolean;
}) {
  const { profile } = detail;
  const attendanceTotal = profile.totalAttendance || 1;
  const presentShare = Math.round((profile.presentAttendance / attendanceTotal) * 100);
  const absentShare = Math.round((profile.absentAttendance / attendanceTotal) * 100);

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-black text-blue-800 hover:text-blue-950 dark:text-blue-200">
        <ArrowLeft className="size-4" aria-hidden />Back to Student 360
      </Link>

      <Card className="portal-accent-blue overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-heading text-3xl font-black text-[var(--portal-text)]">{profile.student}</h2>
                <StatusBadge status={profile.riskLabel} />
                <StatusBadge status={profile.status} />
              </div>
              <p className="mt-2 text-sm font-bold text-[var(--portal-muted)]">{profile.studentNumber} | {profile.classroom}</p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--portal-muted)]">Connected learner view across attendance, grades, reports, fees, guardians, intervention notes, and live workflow follow-ups.</p>
            </div>
            <div className="grid gap-3 text-sm font-black text-[var(--portal-text)] sm:grid-cols-2">
              <span className="portal-subtle-card rounded-lg px-3 py-2">Last report: {profile.lastReportAt}</span>
              <span className="portal-subtle-card rounded-lg px-3 py-2">Last note: {profile.lastNoteAt}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Attendance" value={`${Math.round(profile.attendanceRate)}%`} tone="portal-accent-green" icon={CalendarCheck2} />
        <MetricCard label="Grade average" value={`${Math.round(profile.gradeAverage)}%`} tone="portal-accent-blue" icon={BookOpenCheck} />
        <MetricCard label="Open invoices" value={profile.openInvoices} tone="portal-accent-red" icon={CreditCard} />
        <MetricCard label="Reports" value={profile.reports} tone="portal-accent-amber" icon={FileText} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader><CardTitle>Guardian Links</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detail.guardians.map((guardian) => (
                <div key={guardian.id} className="portal-subtle-card rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <span className="portal-icon-tile portal-tone-green size-10 rounded-lg"><Users className="size-4" aria-hidden /></span>
                    <div>
                      <p className="font-black text-[var(--portal-text)]">{guardian.name}</p>
                      <p className="text-xs font-bold text-[var(--portal-muted)]">{guardian.relationship} | {guardian.email} | {guardian.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
              {!detail.guardians.length ? <p className="text-sm font-bold text-[var(--portal-muted)]">No guardian is linked yet.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Attendance Health</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="portal-subtle-card rounded-lg p-4">
                <p className="text-xs font-black uppercase text-[var(--portal-muted)]">Present share</p>
                <p className="mt-2 font-heading text-3xl font-black text-emerald-700 dark:text-emerald-300">{presentShare}%</p>
              </div>
              <div className="portal-subtle-card rounded-lg p-4">
                <p className="text-xs font-black uppercase text-[var(--portal-muted)]">Absent share</p>
                <p className="mt-2 font-heading text-3xl font-black text-red-700 dark:text-red-300">{absentShare}%</p>
              </div>
              <div className="portal-subtle-card rounded-lg p-4">
                <p className="text-xs font-black uppercase text-[var(--portal-muted)]">30-day rate</p>
                <p className="mt-2 font-heading text-3xl font-black text-blue-800 dark:text-blue-200">{Math.round(profile.attendance30)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Add Intervention Note</CardTitle></CardHeader>
        <CardContent><Student360NoteForm studentId={profile.id} /></CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Grades</CardTitle></CardHeader>
          <CardContent>
            <SimpleGridTable
              headers={["Subject", "Term", "CA", "Exam", "Total", "Grade", "Remark"]}
              rows={detail.grades.map((grade) => [
                grade.subject,
                grade.term,
                grade.classAssessment,
                grade.examScore,
                `${grade.total.toFixed(1)}%`,
                grade.gradeCode,
                grade.remark
              ])}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
          <CardContent>
            <SimpleGridTable
              headers={["Date", "Status", "Recorded by", "Notes"]}
              rows={detail.attendance.map((record) => [
                record.date,
                <StatusBadge key={record.id} status={record.status} />,
                record.recordedBy,
                record.notes
              ])}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Finance Register</CardTitle></CardHeader>
          <CardContent><InvoiceTable data={detail.invoices} showControls={canManageFinance} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Published Reports</CardTitle></CardHeader>
          <CardContent><ReportTable data={detail.reports} viewBasePath={reportBasePath} /></CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Intervention Notes</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {detail.notes.map((note) => (
              <article key={note.id} className="portal-subtle-card rounded-lg p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-base font-black text-[var(--portal-text)]">{note.title}</h3>
                      <StatusBadge status={note.type} />
                      <StatusBadge status={note.visibility} />
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[var(--portal-muted)]">{note.body}</p>
                  </div>
                  <p className="text-xs font-black text-[var(--portal-muted)]">{note.createdBy}<br />{note.createdAt}</p>
                </div>
              </article>
            ))}
            {!detail.notes.length ? <p className="text-sm font-bold text-[var(--portal-muted)]">No intervention notes yet.</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-blue-700 dark:text-blue-200" aria-hidden />
            <CardTitle>Linked Workflow Tasks</CardTitle>
          </div>
        </CardHeader>
        <CardContent><WorkflowTaskTable data={detail.tasks} /></CardContent>
      </Card>
    </div>
  );
}
