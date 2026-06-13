"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  ArrowUpRight,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FilePlus2,
  GitBranch,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRoundCog,
  Users
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDashboardData } from "@/features/admin/queries";
import { ANIMATIONS, cn } from "@/lib/utils";

const toneStyles = {
  blue: "portal-tone-blue",
  green: "portal-tone-green",
  amber: "portal-tone-amber",
  red: "portal-tone-red"
};

const accentStyles = {
  blue: "portal-accent-blue",
  green: "portal-accent-green",
  amber: "portal-accent-amber",
  red: "portal-accent-red"
};

const quickActions = [
  { label: "Review admissions", href: "/admin/admissions", icon: UserCheck, tone: "blue" as const },
  { label: "Review recruitment", href: "/admin/recruitment", icon: BriefcaseBusiness, tone: "amber" as const },
  { label: "Create invoice", href: "/admin/fees#create-invoice", icon: FilePlus2, tone: "green" as const },
  { label: "User access", href: "/admin/access", icon: UserRoundCog, tone: "red" as const },
  { label: "Student 360", href: "/admin/student-360", icon: Sparkles, tone: "blue" as const },
  { label: "Automation", href: "/admin/automation", icon: GitBranch, tone: "amber" as const }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0
  }).format(value);
}

function formatWhen(value: string | null) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-GH", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-GH", { month: "short", day: "2-digit" }).format(new Date(value));
}

function DashboardMetric({
  label,
  value,
  detail,
  tone,
  icon: Icon
}: {
  label: string;
  value: string;
  detail: string;
  tone: keyof typeof toneStyles;
  icon: typeof GraduationCap;
}) {
  return (
    <motion.div {...ANIMATIONS.fadeInUp} {...ANIMATIONS.cardHover}>
      <Card className={cn("portal-metric-card overflow-hidden", accentStyles[tone])}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--portal-muted)]">{label}</p>
              <p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{value}</p>
            </div>
            <span className={cn("portal-icon-tile size-14 rounded-lg", toneStyles[tone])}>
              <Icon className="size-6 stroke-[2.5]" aria-hidden />
            </span>
          </div>
          <p className="mt-4 text-sm font-bold text-[var(--portal-muted)]">{detail}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProgressRow({ label, count, total, tone }: { label: string; count: number; total: number; tone: keyof typeof toneStyles }) {
  const percent = total ? Math.round((count / total) * 100) : 0;
  const barClass = {
    blue: "bg-blue-600",
    green: "bg-emerald-500",
    amber: "bg-amber-400",
    red: "bg-rose-500"
  }[tone];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-[var(--portal-text)]">{label}</span>
        <span className="font-black text-[var(--portal-text)]">{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-300/80 dark:bg-white/10">
        <div className={cn("h-full rounded-full", barClass)} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs font-medium text-[var(--portal-muted)]">
        {count} of {total || count}
      </p>
    </div>
  );
}

function AttendancePanel({ data, breakdown }: { data: AdminDashboardData["attendanceSeries"]; breakdown: AdminDashboardData["attendanceBreakdown"] }) {
  const total = breakdown.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Daily Attendance</CardTitle>
          <p className="mt-1 text-sm font-medium text-[var(--portal-muted)]">Live present and absent records for the current week.</p>
        </div>
        <span className="portal-icon-tile portal-tone-green size-12 rounded-lg">
          <ClipboardCheck className="size-5 stroke-[2.5]" aria-hidden />
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="adminPresent" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="adminAbsent" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(100,116,139,0.18)" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="date" stroke="#102a56" tick={{ fontWeight: 900 }} />
                <YAxis stroke="#102a56" tick={{ fontWeight: 900 }} />
                <Tooltip />
                <Legend />
                <Area dataKey="present" fill="url(#adminPresent)" name="Present" stroke="#0f766e" strokeWidth={3} type="monotone" />
                <Area dataKey="absent" fill="url(#adminAbsent)" name="Absent" stroke="#dc2626" strokeWidth={3} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {breakdown.map((item) => (
              <ProgressRow key={item.label} label={item.label} count={item.count} total={total} tone={item.tone} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancePanel({ data, collectionRate, paidAmount, openAmount }: { data: AdminDashboardData["financeSeries"]; collectionRate: number; paidAmount: number; openAmount: number }) {
  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Fee Collection and Finance</CardTitle>
          <p className="mt-1 text-sm font-medium text-[var(--portal-muted)]">{collectionRate}% collection rate from current invoice records.</p>
        </div>
        <span className="portal-icon-tile portal-tone-amber size-12 rounded-lg">
          <CreditCard className="size-5 stroke-[2.5]" aria-hidden />
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid stroke="rgba(100,116,139,0.18)" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="month" stroke="#102a56" tick={{ fontWeight: 900 }} />
                <YAxis stroke="#102a56" tick={{ fontWeight: 900 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="collected" fill="#0f766e" name="Collected" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg bg-[#047857] p-4 text-white shadow-[0_16px_28px_-18px_rgba(4,120,87,0.8)] ring-1 ring-[#047857]/20 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-400/20 dark:shadow-none">
              <p className="text-xs font-black uppercase tracking-normal">Collected</p>
              <p className="mt-2 text-xl font-black">{formatCurrency(paidAmount)}</p>
            </div>
            <div className="rounded-lg bg-[#b45309] p-4 text-white shadow-[0_16px_28px_-18px_rgba(180,83,9,0.8)] ring-1 ring-[#b45309]/20 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-400/20 dark:shadow-none">
              <p className="text-xs font-black uppercase tracking-normal">Outstanding</p>
              <p className="mt-2 text-xl font-black">{formatCurrency(openAmount)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniCalendar({ events }: { events: AdminDashboardData["events"] }) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const blanks = Array.from({ length: (firstDay.getDay() + 6) % 7 });
  const eventDays = new Set(events.map((event) => new Date(event.starts_at).getDate()));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Event Calendar</CardTitle>
        <CalendarDays className="size-5 text-blue-600" aria-hidden />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-[var(--portal-text)]">
            {new Intl.DateTimeFormat("en-GH", { month: "long", year: "numeric" }).format(today)}
          </p>
          <Link href="/events" className="portal-register-link px-2.5 py-1 text-xs">
            View all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--portal-muted)]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
          {blanks.map((_, index) => <span key={`blank-${index}`} />)}
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
            const active = day === today.getDate();
            const hasEvent = eventDays.has(day);
            return (
              <span
                key={day}
                className={cn(
                  "grid aspect-square place-items-center rounded-lg font-bold",
                  active && "bg-blue-700 text-white",
                  !active && hasEvent && "portal-icon-tile portal-tone-green text-white"
                )}
              >
                {day}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function EventsPanel({ events }: { events: AdminDashboardData["events"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length ? events.slice(0, 4).map((event) => (
          <Link key={event.id} href="/events" className="portal-subtle-card flex items-center gap-3 rounded-lg p-3 transition hover:border-[#174ea6] dark:hover:bg-blue-500/10">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-blue-700 text-center text-xs font-black text-white">
              {formatEventDate(event.starts_at)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-[var(--portal-text)]">{event.title}</span>
              <span className="mt-1 block text-xs font-medium text-[var(--portal-muted)]">{formatWhen(event.starts_at)}</span>
            </span>
          </Link>
        )) : (
          <div className="portal-subtle-card rounded-lg border-dashed p-5 text-sm font-bold text-[var(--portal-muted)]">No upcoming events yet.</div>
        )}
      </CardContent>
    </Card>
  );
}

function OperationsPanel({ queues, activity }: { queues: AdminDashboardData["reviewQueues"]; activity: AdminDashboardData["activityItems"] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notice Board</CardTitle>
        <BellRing className="size-5 text-amber-500" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {queues.map((queue) => (
            <Link key={queue.label} href={queue.href} className="portal-subtle-card flex items-center justify-between gap-4 rounded-lg p-3 transition hover:border-[#174ea6] dark:hover:bg-blue-500/10">
              <span className="text-sm font-black text-[var(--portal-text)]">{queue.label}</span>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-black ring-1", toneStyles[queue.tone])}>{queue.count}</span>
            </Link>
          ))}
        </div>
        <div className="border-t border-[var(--portal-border)] pt-4">
          <p className="text-sm font-black text-[var(--portal-text)]">Recent activity</p>
          <div className="mt-3 space-y-3">
            {activity.length ? activity.slice(0, 4).map((item, index) => (
              <div key={`${item.table}-${item.createdAt}-${index}`} className="flex gap-3">
                <span className="mt-1 size-2 rounded-full bg-emerald-500" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[var(--portal-text)]">{item.label} {item.table}</span>
                  <span className="text-xs font-medium text-[var(--portal-muted)]">{formatWhen(item.createdAt)}</span>
                </span>
              </div>
            )) : <p className="text-sm font-medium text-[var(--portal-muted)]">No protected changes yet.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassLoadPanel({ data }: { data: AdminDashboardData["classLoad"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Load</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length ? data.map((item) => (
          <ProgressRow key={item.className} label={item.className} count={item.students} total={item.capacity} tone={item.students >= item.capacity ? "red" : "blue"} />
        )) : <p className="text-sm font-medium text-[var(--portal-muted)]">No classroom data yet.</p>}
      </CardContent>
    </Card>
  );
}

function RolePanel({ data }: { data: AdminDashboardData["roleCounts"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faculty Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length ? data.slice(0, 7).map((role) => (
          <div key={role.label} className="flex items-center justify-between gap-4 border-b border-[var(--portal-border)] pb-3 last:border-0 last:pb-0">
            <span className="flex min-w-0 items-center gap-3">
              <span className="portal-icon-tile portal-tone-cyan size-9 rounded-lg">
                <Users className="size-4 stroke-[2.5]" aria-hidden />
              </span>
              <span className="truncate text-sm font-bold text-[var(--portal-text)]">{role.label}</span>
            </span>
            <span className="font-heading text-lg font-black text-[var(--portal-text)]">{role.count}</span>
          </div>
        )) : <p className="text-sm font-medium text-[var(--portal-muted)]">No staff roles yet.</p>}
      </CardContent>
    </Card>
  );
}

export function AdminDashboardView({ dashboard }: { dashboard: AdminDashboardData }) {
  return (
    <motion.div className="space-y-6" {...ANIMATIONS.staggerContainer}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric label="Students" value={dashboard.metrics.students.toLocaleString("en-GH")} detail="Active enrollment records" tone="blue" icon={GraduationCap} />
        <DashboardMetric label="Staff" value={dashboard.metrics.staff.toLocaleString("en-GH")} detail="Active operational accounts" tone="green" icon={Users} />
        <DashboardMetric label="Attendance" value={`${dashboard.metrics.attendanceRate}%`} detail="Recorded today" tone="amber" icon={ClipboardCheck} />
        <DashboardMetric label="Open invoices" value={dashboard.metrics.openInvoices.toLocaleString("en-GH")} detail={`${dashboard.metrics.collectionRate}% collection rate`} tone="red" icon={CreditCard} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "portal-action-card h-auto min-h-16 justify-between rounded-lg p-4 pl-5 !whitespace-normal text-left hover:-translate-y-0.5",
                accentStyles[action.tone]
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className={cn("portal-icon-tile size-10 rounded-lg", toneStyles[action.tone])}>
                  <Icon className="size-5 stroke-[2.5]" aria-hidden />
                </span>
                <span className="font-black">{action.label}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0" aria-hidden />
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <AttendancePanel data={dashboard.attendanceSeries} breakdown={dashboard.attendanceBreakdown} />
          <FinancePanel
            data={dashboard.financeSeries}
            collectionRate={dashboard.metrics.collectionRate}
            paidAmount={dashboard.metrics.paidAmount}
            openAmount={dashboard.metrics.openAmount}
          />
          <div className="grid gap-6 xl:grid-cols-2">
            <ClassLoadPanel data={dashboard.classLoad} />
            <Card className="portal-brand-card self-start overflow-hidden">
              <CardContent className="p-6">
                <Sparkles className="size-7 text-yellow-300" aria-hidden />
                <h2 className="mt-5 font-heading text-2xl font-black text-white">Operations Pulse</h2>
                <p className="mt-3 text-sm leading-6 text-blue-50">
                  {dashboard.metrics.openAdmissions + dashboard.metrics.openRecruitment + dashboard.metrics.openTasks} review item{dashboard.metrics.openAdmissions + dashboard.metrics.openRecruitment + dashboard.metrics.openTasks === 1 ? "" : "s"} waiting across admissions, recruitment, and automation.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link href="/admin/admissions" className="portal-brand-primary-link rounded-lg px-4 py-3 text-sm font-black">Admissions</Link>
                  <Link href="/admin/automation" className="portal-brand-secondary-link rounded-lg px-4 py-3 text-sm font-black">Automation</Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="space-y-6">
          <MiniCalendar events={dashboard.events} />
          <EventsPanel events={dashboard.events} />
          <OperationsPanel queues={dashboard.reviewQueues} activity={dashboard.activityItems} />
          <RolePanel data={dashboard.roleCounts} />
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <span className="portal-icon-tile portal-tone-blue size-12 rounded-lg">
                <ShieldCheck className="size-5 stroke-[2.5]" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-black text-[var(--portal-text)]">Connected suites</p>
                <p className="mt-1 text-sm leading-6 text-[var(--portal-muted)]">HR, finance, library, IT, admissions, recruitment, reports, and access control are available from the operations rail.</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </motion.div>
  );
}
