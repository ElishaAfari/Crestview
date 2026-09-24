import Link from "next/link";
import {
  CalendarCheck2,
  ClipboardCheck,
  Clock3,
  Users,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendanceOverview } from "@/features/attendance/overview-queries";

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card className="portal-metric-card">
      <CardContent className="p-5">
        <p className="text-sm font-black text-[var(--portal-muted)]">{label}</p>
        <p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">
          {value}
        </p>
        <p className="mt-1 text-xs font-bold text-[var(--portal-muted)]">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default async function AttendanceOverviewPage() {
  const overview = await getAttendanceOverview();
  const dateLabel = new Intl.DateTimeFormat("en-GH", {
    dateStyle: "full",
  }).format(new Date(`${overview.date}T12:00:00`));
  const markedClasses = overview.classrooms.filter(
    (classroom) => classroom.status === "Marked",
  ).length;

  return (
    <PageWrapper
      title={`Attendance - ${overview.studentTotals.marked} of ${overview.studentTotals.enrolled} marked today`}
      description={`${dateLabel}. Monitor student registers and staff clocking from one live daily view.`}
    >
      <div className="flex flex-wrap gap-3">
        <Link className="ref-button ref-button-primary" href="/attendance/mark">
          <CalendarCheck2 className="size-4" aria-hidden /> Mark student attendance
        </Link>
        <Link className="ref-button ref-button-secondary" href="/staff-clock">
          <Clock3 className="size-4" aria-hidden /> Staff clock register
        </Link>
        <Link className="ref-button ref-button-secondary" href="/attendance/reports">
          <ClipboardCheck className="size-4" aria-hidden /> Attendance reports
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Student attendance"
          value={`${overview.studentTotals.rate}%`}
          detail={`${overview.studentTotals.present} present or late of ${overview.studentTotals.marked} marked`}
        />
        <Metric
          label="Sections marked"
          value={`${markedClasses} / ${overview.classrooms.length}`}
          detail={`${overview.classrooms.length - markedClasses} classes still need a register`}
        />
        <Metric
          label="Staff in today"
          value={`${overview.staffTotals.clockedIn} / ${overview.staffTotals.total}`}
          detail={`${overview.staffTotals.pending} still awaiting clock-in`}
        />
        <Metric
          label="Staff clocked out"
          value={overview.staffTotals.completed}
          detail="Completed daily staff shifts"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s marking board</CardTitle>
            <p className="text-sm font-bold text-[var(--portal-muted)]">
              Every active class stays visible until its student register has entries.
            </p>
          </CardHeader>
          <CardContent>
            <div className="portal-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Students marked</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.classrooms.map((classroom) => (
                    <tr key={classroom.id}>
                      <td className="font-black">{classroom.label}</td>
                      <td>{`${classroom.marked}/${classroom.enrolled}`}</td>
                      <td>
                        <span
                          className={
                            classroom.status === "Marked"
                              ? "portal-status-success"
                              : "portal-status-warning"
                          }
                        >
                          {classroom.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!overview.classrooms.length ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center font-bold text-[var(--portal-muted)]">
                        No active classes have been configured.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff attendance</CardTitle>
            <p className="text-sm font-bold text-[var(--portal-muted)]">
              Staff clock themselves with their QR card or CIS/STA fallback ID. Each staff member has one daily record.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-[var(--portal-border)] p-4">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-[var(--portal-accent)]" aria-hidden />
                <div>
                  <p className="font-black text-[var(--portal-text)]">{overview.staffTotals.clockedIn} staff clocked in</p>
                  <p className="text-sm font-bold text-[var(--portal-muted)]">
                    {overview.staffTotals.completed} have recorded a clock-out.
                  </p>
                </div>
              </div>
            </div>
            <Link className="ref-button ref-button-primary w-full justify-center" href="/staff-clock">
              Open staff clock register
            </Link>
            <p className="text-xs font-bold text-[var(--portal-muted)]">
              Only the school owner and super admin can open a previous day for a documented correction.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
