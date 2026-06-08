"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { CreditCard, GraduationCap, MessageSquare, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ParentDashboard = {
  children: number;
  attendanceRate: number;
  openInvoices: number;
  unreadNotifications: number;
};

export function ParentDashboardView({ dashboard }: { dashboard: ParentDashboard }) {
  const attendanceData = [
    { label: "Week 1", rate: Math.max(0, dashboard.attendanceRate - 4) },
    { label: "Week 2", rate: Math.max(0, dashboard.attendanceRate - 1) },
    { label: "Week 3", rate: dashboard.attendanceRate },
    { label: "Week 4", rate: Math.min(100, dashboard.attendanceRate + 2) }
  ];
  const financeData = [
    { label: "Paid", value: Math.max(1, dashboard.children * 2) },
    { label: "Open", value: dashboard.openInvoices },
    { label: "Messages", value: dashboard.unreadNotifications }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Children" value={String(dashboard.children)} change="Linked active students" tone="blue" />
        <KPICard label="Attendance" value={`${dashboard.attendanceRate}%`} change="Family attendance rate" tone="green" />
        <KPICard label="Invoices" value={String(dashboard.openInvoices)} change="Open family invoices" tone="amber" />
        <KPICard label="Messages" value={String(dashboard.unreadNotifications)} change="Unread notifications" tone="red" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="portal-metric-card portal-accent-green overflow-hidden">
          <CardContent className="grid gap-5 p-5 md:grid-cols-[auto_1fr] md:items-center">
            <span className="portal-icon-tile portal-tone-green size-14 rounded-lg">
              <ShieldCheck className="size-7 stroke-[2.5]" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-black uppercase text-[var(--portal-muted)]">Family overview</p>
              <h2 className="mt-1 font-heading text-3xl font-black text-[var(--portal-text)]">Guardian control center</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--portal-muted)]">Only linked children, family invoices, and guardian messages appear here, keeping each parent workspace private.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Family Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { href: "/parent/children", label: "Review children", icon: GraduationCap, tone: "portal-tone-blue" },
              { href: "/parent/fees", label: "Open fees", icon: CreditCard, tone: "portal-tone-amber" },
              { href: "/parent/messages", label: "Read messages", icon: MessageSquare, tone: "portal-tone-red" }
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="portal-action-card flex items-center gap-3 rounded-lg p-3">
                  <span className={`portal-icon-tile ${action.tone} size-10 rounded-lg`}><Icon className="size-5" aria-hidden /></span>
                  <span className="text-sm font-black text-[var(--portal-text)]">{action.label}</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Children Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="parentAttendanceFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#174ea6" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#174ea6" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(30,64,175,0.14)" vertical={false} />
                  <XAxis dataKey="label" stroke="#1f2f46" tick={{ fontWeight: 800 }} />
                  <YAxis domain={[0, 100]} stroke="#1f2f46" tick={{ fontWeight: 800 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="rate" stroke="#174ea6" strokeWidth={3} fill="url(#parentAttendanceFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Family Finance and Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeData}>
                  <CartesianGrid stroke="rgba(30,64,175,0.14)" vertical={false} strokeDasharray="4 6" />
                  <XAxis dataKey="label" stroke="#1f2f46" tick={{ fontWeight: 800 }} />
                  <YAxis allowDecimals={false} stroke="#1f2f46" tick={{ fontWeight: 800 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
