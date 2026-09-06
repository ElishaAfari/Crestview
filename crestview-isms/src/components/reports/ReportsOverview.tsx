import Link from "next/link";
import { ArrowRight, BarChart3, BookOpenCheck, CalendarCheck2, CircleDollarSign, FileText, PackageSearch, UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardData } from "@/features/admin/queries";

const reportLinks = [
  { href: "/reports/academic", label: "Academic reports", description: "Report cards, marks, grades, rankings, and publication.", icon: BookOpenCheck },
  { href: "/reports/financial", label: "Financial reports", description: "Billed, collected, outstanding, and daily fee trends.", icon: CircleDollarSign },
  { href: "/attendance/reports", label: "Attendance reports", description: "Daily attendance, trends, and follow-up visibility.", icon: CalendarCheck2 },
  { href: "/reports/hr-payroll", label: "HR and payroll", description: "Staff records, leave, recruitment, and payroll readiness.", icon: UsersRound },
  { href: "/reports/inventory", label: "Inventory reports", description: "Assets, stock movements, low-stock, and procurement.", icon: PackageSearch },
  { href: "/admin/reports", label: "Generate a report", description: "Create and publish a student or school report pack.", icon: FileText }
];

function money(value: number) {
  return `GHS ${value.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;
}

export async function ReportsOverview() {
  const dashboard = await getAdminDashboardData();
  const latestAttendance = dashboard.attendanceSeries.at(-1)?.rate ?? dashboard.metrics.attendanceRate;
  const collected = dashboard.financeSeries.reduce((sum, item) => sum + item.collected, 0);
  const billed = collected + dashboard.financeSeries.reduce((sum, item) => sum + item.pending, 0);

  return (
    <div className="reference-workspace space-y-6">
      <section className="ref-stats">
        <div className="ref-stat"><span>Total students</span><strong>{dashboard.metrics.students}</strong><p>{dashboard.metrics.staff} staff across {dashboard.classLoad.length} active classes</p></div>
        <div className="ref-stat"><span>Attendance today</span><strong>{latestAttendance}%</strong><p>Present and late records combined</p></div>
        <div className="ref-stat"><span>Fees collected</span><strong>{money(collected)}</strong><p>Recent invoice and daily-fee collections</p></div>
        <div className="ref-stat"><span>Outstanding</span><strong>{money(Math.max(0, billed - collected))}</strong><p>Open financial exposure</p></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportLinks.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className="ref-panel group block transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4"><span className="ref-avatar"><Icon className="size-5" aria-hidden /></span><ArrowRight className="size-4 text-[var(--portal-muted)] transition group-hover:translate-x-1" aria-hidden /></div>
            <h2 className="mt-4 text-base font-black text-[var(--portal-text)]">{label}</h2><p className="mt-1 text-sm">{description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Attendance trend</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Last seven days from the school attendance register.</p></CardHeader><CardContent><div className="space-y-4">{dashboard.attendanceSeries.map((day) => <div key={day.date}><div className="flex items-center justify-between text-sm font-black"><span>{day.date}</span><span>{day.rate}%</span></div><div className="mt-2 h-3 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(day.rate, 2)}%` }} /></div><p className="mt-1 text-xs font-semibold text-[var(--portal-muted)]">{day.present} present, {day.absent} absent</p></div>)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Fee collection</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Billed versus collected across the recent reporting window.</p></CardHeader><CardContent><div className="space-y-4">{dashboard.financeSeries.map((month) => { const total = month.collected + month.pending; const collectedWidth = total ? Math.round((month.collected / total) * 100) : 0; return <div key={month.month}><div className="flex items-center justify-between text-sm font-black"><span>{month.month}</span><span>{money(month.collected)}</span></div><div className="mt-2 flex h-3 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/40"><div className="bg-emerald-600" style={{ width: `${collectedWidth}%` }} /><div className="bg-amber-500" style={{ width: `${100 - collectedWidth}%` }} /></div><p className="mt-1 text-xs font-semibold text-[var(--portal-muted)]">{money(month.pending)} pending</p></div>; })}</div></CardContent></Card>
      </section>

      <Card><CardHeader><CardTitle>Operational report shortcuts</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">The report centre is connected to live school registers and role-protected workspaces.</p></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Link className="ref-button ref-button-secondary" href="/students/academic-reports"><BarChart3 className="size-4" aria-hidden />Student performance</Link><Link className="ref-button ref-button-secondary" href="/finance"><CircleDollarSign className="size-4" aria-hidden />Finance overview</Link><Link className="ref-button ref-button-secondary" href="/attendance"><CalendarCheck2 className="size-4" aria-hidden />Attendance control</Link><Link className="ref-button ref-button-secondary" href="/platform-audit"><FileText className="size-4" aria-hidden />Audit centre</Link></div></CardContent></Card>
    </div>
  );
}
