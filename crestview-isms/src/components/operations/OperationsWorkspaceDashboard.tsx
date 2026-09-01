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
import { ArrowUpRight, BookOpen, Boxes, Bus, ClipboardList, CreditCard, Database, HeartPulse, Megaphone, School, ShieldCheck, Settings, Users } from "lucide-react";
import Link from "next/link";
import type { OperationsModule, OperationsWorkspace } from "@/config/operations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ANIMATIONS, cn } from "@/lib/utils";

type WorkspaceWithCounts = Omit<OperationsWorkspace, "modules"> & { modules: Array<OperationsModule & { count: number }> };

const workspaceMeta = {
  "front-office": {
    icon: School,
    title: "Reception control",
    insight: "Enquiries, visitors, parent complaints and public-facing requests are consolidated for front desk follow-up.",
    accent: "portal-accent-blue",
    tone: "portal-tone-blue"
  },
  "id-cards": {
    icon: CreditCard,
    title: "Identity assurance",
    insight: "Student cards, staff cards and QR verification logs keep attendance, payments and access checks aligned.",
    accent: "portal-accent-blue",
    tone: "portal-tone-blue"
  },
  preschool: {
    icon: School,
    title: "Early years care",
    insight: "Daily logs, observations, pickups and incidents help preschool staff send parent-ready care updates.",
    accent: "portal-accent-green",
    tone: "portal-tone-green"
  },
  "academics-office": {
    icon: BookOpen,
    title: "Academic planning",
    insight: "Schemes of work, curriculum units, lesson plans, resources and timetables stay connected to classroom delivery.",
    accent: "portal-accent-green",
    tone: "portal-tone-green"
  },
  exams: {
    icon: ClipboardList,
    title: "Exam readiness",
    insight: "Exam windows, sessions, assessment items and published reports are visible from one assessment control point.",
    accent: "portal-accent-amber",
    tone: "portal-tone-amber"
  },
  communication: {
    icon: Megaphone,
    title: "Communication flow",
    insight: "Notices, campaigns, email queues, SMS queues and conversations are monitored for role-specific communication.",
    accent: "portal-accent-red",
    tone: "portal-tone-red"
  },
  bursary: {
    icon: CreditCard,
    title: "Cashier control",
    insight: "Cashier sessions, receipts and daily fee payment records support clean shift closure and reconciliation.",
    accent: "portal-accent-amber",
    tone: "portal-tone-amber"
  },
  accounting: {
    icon: Database,
    title: "Ledger readiness",
    insight: "Chart of accounts, fiscal years, journals, supplier bills and bank accounts prepare finance for double-entry reporting.",
    accent: "portal-accent-green",
    tone: "portal-tone-green"
  },
  feeding: {
    icon: CreditCard,
    title: "Feeding collections",
    insight: "Daily feeding enrollment, payments, exemptions and adjustments stay traceable for finance and parents.",
    accent: "portal-accent-amber",
    tone: "portal-tone-amber"
  },
  "extra-classes": {
    icon: BookOpen,
    title: "Extra class collections",
    insight: "Extra class enrollment, daily payments and adjustments are separated from core school fees for clearer reporting.",
    accent: "portal-accent-blue",
    tone: "portal-tone-blue"
  },
  boarding: {
    icon: Users,
    title: "Boarding operations",
    insight: "Houses, dormitories, assignments, roll calls, exeats, visitors and incidents are tracked in one facilities workspace.",
    accent: "portal-accent-red",
    tone: "portal-tone-red"
  },
  transport: {
    icon: Bus,
    title: "Transport pulse",
    insight: "Routes, vehicles, stops, trip logs and student transport assignments are grouped for operational visibility.",
    accent: "portal-accent-blue",
    tone: "portal-tone-blue"
  },
  inventory: {
    icon: Boxes,
    title: "Inventory control",
    insight: "Stock items, movements, technology assets and procurement expenses are tracked for reorder and audit readiness.",
    accent: "portal-accent-green",
    tone: "portal-tone-green"
  },
  "learner-care": {
    icon: HeartPulse,
    title: "Learner care",
    insight: "Wellbeing, behaviour, medical notes and Student 360 follow-up records are gathered for protected support work.",
    accent: "portal-accent-red",
    tone: "portal-tone-red"
  },
  hr: {
    icon: Users,
    title: "People pulse",
    insight: "Recruitment, staff records, leave and payroll readiness are monitored from this workspace.",
    accent: "portal-accent-blue",
    tone: "portal-tone-blue"
  },
  finance: {
    icon: CreditCard,
    title: "Finance control",
    insight: "Invoices, payments, expenses and payroll reviews stay visible for school finance operations.",
    accent: "portal-accent-green",
    tone: "portal-tone-green"
  },
  library: {
    icon: BookOpen,
    title: "Library circulation",
    insight: "Catalog health, copy inventory, loans and fines are consolidated for the librarian.",
    accent: "portal-accent-amber",
    tone: "portal-tone-amber"
  },
  it: {
    icon: Settings,
    title: "Technology desk",
    insight: "Devices, support tickets, integrations and audit events are tracked from the IT suite.",
    accent: "portal-accent-red",
    tone: "portal-tone-red"
  }
} satisfies Record<OperationsWorkspace["key"], { icon: typeof Users; title: string; insight: string; accent: string; tone: string }>;

const accents = ["portal-accent-blue", "portal-accent-green", "portal-accent-amber", "portal-accent-red"] as const;
const tones = ["portal-tone-blue", "portal-tone-green", "portal-tone-amber", "portal-tone-red"] as const;

function progressValue(count: number, index: number) {
  return Math.min(96, Math.max(18, count * 11 + 32 + index * 7));
}

export function OperationsWorkspaceDashboard({ workspace }: { workspace: WorkspaceWithCounts }) {
  const meta = workspaceMeta[workspace.key];
  const Icon = meta.icon;
  const totalRecords = workspace.modules.reduce((sum, module) => sum + module.count, 0);
  const chartData = workspace.modules.map((module, index) => ({
    name: module.label.replace(" periods", "").replace(" requests", ""),
    records: module.count,
    readiness: progressValue(module.count, index)
  }));
  const areaData = chartData.map((item, index) => ({
    name: item.name,
    activity: item.records + index + 1,
    readiness: item.readiness
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className={cn("portal-metric-card overflow-hidden", meta.accent)}>
          <CardContent className="grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className={cn("portal-icon-tile size-14 rounded-lg", meta.tone)}>
              <Icon className="size-7 stroke-[2.5]" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-black uppercase text-[var(--portal-muted)]">{meta.title}</p>
              <h2 className="mt-1 font-heading text-3xl font-black tracking-normal text-[var(--portal-text)]">{totalRecords} live records</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--portal-muted)]">{meta.insight}</p>
            </div>
            <Link href={`/${workspace.key}/${workspace.modules[0]?.key ?? ""}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#174ea6] px-4 py-2 text-sm font-black text-white shadow-[0_16px_30px_-18px_rgba(23,78,166,0.9)] transition hover:bg-[#07377f]">
              Open first register <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Workspace Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workspace.modules.map((module, index) => (
              <div key={module.key}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-black text-[var(--portal-text)]">{module.label}</p>
                  <p className="text-sm font-black text-[var(--portal-text)]">{progressValue(module.count, index)}%</p>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-[#d7e8ff] dark:bg-white/10">
                  <div className={cn("h-full rounded-full", tones[index % tones.length])} style={{ width: `${progressValue(module.count, index)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workspace.modules.map((module, index) => (
          <motion.div key={module.key} {...ANIMATIONS.fadeInUp} {...ANIMATIONS.cardHover}>
            <Card className={cn("portal-metric-card overflow-hidden", accents[index % accents.length])}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[var(--portal-muted)]">{module.label}</p>
                    <p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{module.count}</p>
                  </div>
                  <span className={cn("portal-icon-tile size-12 rounded-lg", tones[index % tones.length])}>
                    <Database className="size-5 stroke-[2.5]" aria-hidden />
                  </span>
                </div>
                <p className="mt-4 min-h-10 text-sm font-semibold leading-5 text-[var(--portal-muted)]">{module.description}</p>
                <Link href={`/${workspace.key}/${module.key}`} className="portal-register-link mt-4 px-3 py-1.5 text-xs">
                  Open register <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Operational Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="rgba(30,64,175,0.14)" vertical={false} strokeDasharray="4 6" />
                  <XAxis dataKey="name" stroke="#1f2f46" tick={{ fontWeight: 800 }} />
                  <YAxis stroke="#1f2f46" tick={{ fontWeight: 800 }} />
                  <Tooltip />
                  <Bar dataKey="records" radius={[8, 8, 0, 0]} fill="#174ea6" />
                  <Bar dataKey="readiness" radius={[8, 8, 0, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Rhythm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id={`${workspace.key}ActivityFill`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(30,64,175,0.14)" vertical={false} />
                  <XAxis dataKey="name" stroke="#1f2f46" hide />
                  <YAxis stroke="#1f2f46" hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="activity" stroke="#0f766e" strokeWidth={3} fill={`url(#${workspace.key}ActivityFill)`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {workspace.modules.map((module) => (
                <Link key={module.key} href={`/${workspace.key}/${module.key}`} className="portal-subtle-card flex items-center justify-between gap-4 rounded-lg p-3 transition hover:border-[#174ea6]">
                  <div className="flex min-w-0 items-center gap-3">
                    <ShieldCheck className="size-4 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[var(--portal-text)]">{module.label}</p>
                      <p className="truncate text-xs font-semibold text-[var(--portal-muted)]">{module.description}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-[#174ea6] dark:text-blue-200" aria-hidden />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
