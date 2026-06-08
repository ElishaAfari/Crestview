"use client";

import { motion } from "framer-motion";
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
import { Bot, CalendarCheck, FileText, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { AIPredictionBadge } from "@/components/ai/AIPredictionBadge";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ANIMATIONS } from "@/lib/utils";

type StudentDashboard = {
  average: number;
  attendanceRate: number;
  assignmentCount: number;
  openInvoices: number;
  reportCount: number;
};

export function StudentDashboardView({ dashboard }: { dashboard: StudentDashboard }) {
  const progressData = [
    { label: "Literacy", score: Math.max(52, dashboard.average - 4) },
    { label: "Numeracy", score: Math.max(55, dashboard.average + 2) },
    { label: "STEM", score: Math.max(50, dashboard.average + 5) },
    { label: "Creative", score: Math.max(48, dashboard.average - 1) }
  ];
  const attendanceData = [
    { day: "Mon", present: Math.max(0, dashboard.attendanceRate - 3) },
    { day: "Tue", present: Math.max(0, dashboard.attendanceRate - 1) },
    { day: "Wed", present: dashboard.attendanceRate },
    { day: "Thu", present: Math.min(100, dashboard.attendanceRate + 2) },
    { day: "Fri", present: Math.min(100, dashboard.attendanceRate + 1) }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Average" value={`${dashboard.average}%`} change="Published grade average" tone="green" />
        <KPICard label="Attendance" value={`${dashboard.attendanceRate}%`} change="Recorded attendance rate" tone="blue" />
        <KPICard label="Assignments" value={String(dashboard.assignmentCount)} change="Assigned to your class" tone="amber" />
        <KPICard label="Invoices" value={String(dashboard.openInvoices)} change={`${dashboard.reportCount} saved report${dashboard.reportCount === 1 ? "" : "s"}`} tone="red" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="portal-metric-card portal-accent-blue overflow-hidden">
          <CardContent className="grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="portal-icon-tile portal-tone-blue size-14 rounded-lg">
              <Sparkles className="size-7 stroke-[2.5]" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-black uppercase text-[var(--portal-muted)]">AI learning status</p>
              <h2 className="mt-1 font-heading text-3xl font-black text-[var(--portal-text)]">Personal learning workspace</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--portal-muted)]">Track assignments, attendance, grades, reports, and AI tutor support from one student-only view.</p>
            </div>
            <AIPredictionBadge level={dashboard.average >= 70 && dashboard.attendanceRate >= 85 ? "green" : "amber"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Learning Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { href: "/student/assignments", label: "Open assignments", icon: FileText },
              { href: "/student/grades", label: "Review grades", icon: GraduationCap },
              { href: "/student/attendance", label: "Check attendance", icon: CalendarCheck },
              { href: "/student/ai-tutor", label: "Ask AI tutor", icon: Bot }
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="portal-action-card flex items-center gap-3 rounded-lg p-3">
                  <span className="portal-icon-tile portal-tone-green size-10 rounded-lg"><Icon className="size-5" aria-hidden /></span>
                  <span className="text-sm font-black text-[var(--portal-text)]">{action.label}</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Subject Momentum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <CartesianGrid stroke="rgba(30,64,175,0.14)" vertical={false} strokeDasharray="4 6" />
                  <XAxis dataKey="label" stroke="#1f2f46" tick={{ fontWeight: 800 }} />
                  <YAxis domain={[0, 100]} stroke="#1f2f46" tick={{ fontWeight: 800 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#174ea6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Rhythm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="studentAttendanceFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(30,64,175,0.14)" vertical={false} />
                  <XAxis dataKey="day" stroke="#1f2f46" tick={{ fontWeight: 800 }} />
                  <YAxis domain={[0, 100]} stroke="#1f2f46" tick={{ fontWeight: 800 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="present" stroke="#0f766e" strokeWidth={3} fill="url(#studentAttendanceFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <motion.section {...ANIMATIONS.fadeInUp} className="grid gap-4 md:grid-cols-3">
        {[
          ["Next focus", dashboard.assignmentCount ? `${dashboard.assignmentCount} assignment${dashboard.assignmentCount === 1 ? "" : "s"} to organize` : "No open assignments yet"],
          ["Academic file", `${dashboard.reportCount} report${dashboard.reportCount === 1 ? "" : "s"} saved for review`],
          ["Finance note", dashboard.openInvoices ? `${dashboard.openInvoices} invoice${dashboard.openInvoices === 1 ? "" : "s"} linked to your account` : "No open student invoices"]
        ].map(([title, body]) => (
          <Card key={title}>
            <CardContent className="p-5">
              <p className="text-sm font-black uppercase text-[var(--portal-muted)]">{title}</p>
              <p className="mt-3 text-lg font-black text-[var(--portal-text)]">{body}</p>
            </CardContent>
          </Card>
        ))}
      </motion.section>
    </div>
  );
}
