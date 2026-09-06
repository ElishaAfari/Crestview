import Link from "next/link";
import { ArrowRight, BookOpen, Boxes, ClipboardCheck, CreditCard, Database, LayoutDashboard, School, Settings, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { OperationsRecordForm } from "@/components/operations/OperationsRecordForm";
import { loadOperationsModule, loadOperationsWorkspace } from "@/features/operations/queries";

type RemainingSuiteKey = "front-office" | "id-cards" | "preschool" | "academics-office" | "exams" | "platform-audit" | "library" | "it";

const suiteMeta: Record<RemainingSuiteKey, { icon: typeof School; eyebrow: string; title: string; insight: string; setup: string }> = {
  "front-office": {
    icon: Users,
    eyebrow: "Reception control",
    title: "Front Office",
    insight: "Keep enquiries, visitors, complaints, and public-facing requests traceable from first contact to follow-up.",
    setup: "Start the front-office register with the first enquiry or visitor record."
  },
  "id-cards": {
    icon: CreditCard,
    eyebrow: "Identity assurance",
    title: "ID Cards",
    insight: "Issue, verify, and monitor student and staff identity cards with QR-ready records and print status.",
    setup: "Create the first card record to activate issuing and verification tracking."
  },
  preschool: {
    icon: School,
    eyebrow: "Early years care",
    title: "Preschool",
    insight: "Bring daily logs, observations, pickups, incidents, portfolios, and parent-ready updates into one workspace.",
    setup: "Record the first daily care log or observation to begin the preschool register."
  },
  "academics-office": {
    icon: BookOpen,
    eyebrow: "Academic planning",
    title: "Academic Planning",
    insight: "Coordinate schemes, curriculum units, lesson plans, study materials, timetables, and teaching readiness.",
    setup: "Add the first scheme or curriculum unit to begin the academic planning register."
  },
  exams: {
    icon: ClipboardCheck,
    eyebrow: "Assessment control",
    title: "Examinations",
    insight: "Manage exam windows, sessions, grading items, report publication, and timetable readiness from one control point.",
    setup: "Open the first exam window to connect sessions and grading workflows."
  },
  "platform-audit": {
    icon: ShieldCheck,
    eyebrow: "Platform assurance",
    title: "Platform Audit",
    insight: "Monitor workflow tasks, protected changes, integrations, invitations, and delivery queues for beta readiness.",
    setup: "Use the linked registers below to review system health and protected activity."
  },
  library: {
    icon: BookOpen,
    eyebrow: "Library circulation",
    title: "Library",
    insight: "Connect catalogues, physical copies, loans, returns, and fine records for an accountable library desk.",
    setup: "Add the first catalogue item to make circulation tracking available."
  },
  it: {
    icon: Settings,
    eyebrow: "Technology desk",
    title: "IT Support",
    insight: "Track devices, support tickets, integrations, and audit activity across the school platform.",
    setup: "Open the first support ticket or device record to establish the IT register."
  }
};

const tones = ["portal-tone-blue", "portal-tone-green", "portal-tone-amber", "portal-tone-red"];
const accents = ["portal-accent-blue", "portal-accent-green", "portal-accent-amber", "portal-accent-red"];

export async function RemainingSuiteOverview({ workspaceKey }: { workspaceKey: RemainingSuiteKey }) {
  const workspace = await loadOperationsWorkspace(workspaceKey);
  if (!workspace) return null;
  const meta = suiteMeta[workspaceKey];
  const Icon = meta.icon;
  const totalRecords = workspace.modules.reduce((sum, item) => sum + item.count, 0);
  const setupGaps = workspace.modules.filter((item) => item.count === 0).length;
  const primary = workspace.modules.find((item) => item.createFields?.length) ?? workspace.modules[0];
  const register = primary ? await loadOperationsModule(workspaceKey, primary.key) : null;
  const attention = workspace.modules.filter((item) => item.count === 0 || /task|queue|incident|request|report|overdue|expiry|maintenance/i.test(item.label)).slice(0, 4);

  return (
    <div className="reference-workspace space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="portal-metric-card portal-accent-blue overflow-hidden">
          <CardContent className="grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="portal-icon-tile portal-tone-blue size-14 rounded-lg"><Icon className="size-7 stroke-[2.5]" aria-hidden /></span>
            <div><p className="text-sm font-black uppercase text-[var(--portal-muted)]">{meta.eyebrow}</p><h2 className="mt-1 font-heading text-3xl font-black text-[var(--portal-text)]">{totalRecords} live records</h2><p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--portal-muted)]">{meta.insight}</p></div>
            {primary ? <Link href={`/${workspaceKey}/${primary.key}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#174ea6] px-4 py-2 text-sm font-black text-white shadow-[0_16px_30px_-18px_rgba(23,78,166,0.9)] transition hover:bg-[#07377f]">Open register <ArrowRight className="size-4" aria-hidden /></Link> : null}
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Workspace health</CardTitle></CardHeader><CardContent className="space-y-3">{workspace.modules.slice(0, 6).map((item, index) => { const readiness = item.count ? Math.min(100, 42 + item.count * 9) : 12; return <div key={item.key}><div className="flex items-center justify-between gap-4"><p className="text-sm font-black text-[var(--portal-text)]">{item.label}</p><p className="text-sm font-black text-[var(--portal-text)]">{readiness}%</p></div><div className="mt-2 h-2.5 rounded-full bg-[#d7e8ff] dark:bg-white/10"><div className={`h-full rounded-full ${tones[index % tones.length]}`} style={{ width: `${readiness}%` }} /></div></div>; })}</CardContent></Card>
      </section>

      <section className="ref-stats">
        <div className="ref-stat"><span>Live records</span><strong>{totalRecords}</strong><p>Across {workspace.modules.length} connected registers</p></div>
        <div className="ref-stat"><span>Registers</span><strong>{workspace.modules.length}</strong><p>Role-protected operational modules</p></div>
        <div className="ref-stat"><span>Setup gaps</span><strong>{setupGaps}</strong><p>Registers with no records yet</p></div>
        <div className="ref-stat"><span>Attention items</span><strong>{attention.length}</strong><p>Queues and follow-up areas</p></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workspace.modules.map((item, index) => (
          <Link key={item.key} href={`/${workspaceKey}/${item.key}`} className={`portal-metric-card ${accents[index % accents.length]} block overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg`}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[var(--portal-muted)]">{item.label}</p><p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{item.count}</p></div><span className={`portal-icon-tile ${tones[index % tones.length]} size-11 rounded-lg`}><Database className="size-5 stroke-[2.5]" aria-hidden /></span></div>
            <p className="mt-4 min-h-10 text-sm font-semibold leading-5 text-[var(--portal-muted)]">{item.description}</p><span className="portal-register-link mt-4 px-3 py-1.5 text-xs">Open register <ArrowRight className="size-3.5" aria-hidden /></span>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card><CardHeader><CardTitle>{primary?.label ?? "Primary register"}</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">{primary?.description ?? meta.setup}</p></CardHeader><CardContent>{register?.records.length ? <OperationsGenericTable records={register.records.slice(0, 15)} fields={register.module.fields} searchFields={register.module.searchFields} /> : <div className="portal-empty-state"><h3>{meta.setup}</h3><p>Use the connected register to make this suite operational for the next workflow step.</p>{primary ? <Link className="ref-button ref-primary mt-4" href={`/${workspaceKey}/${primary.key}`}>Open {primary.label.toLowerCase()} <ArrowRight className="size-4" aria-hidden /></Link> : null}</div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Quick actions</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Move directly into the registers that need setup or review.</p></CardHeader><CardContent className="space-y-3">{(workspace.quickActions ?? workspace.modules.slice(0, 5).map((item) => ({ label: item.createFields?.length ? `New ${item.label.toLowerCase()}` : item.label, description: item.description, href: `/${workspaceKey}/${item.key}` }))).map((action, index) => <Link key={`${action.href}-${action.label}`} href={action.href} className="portal-subtle-card flex items-center justify-between gap-4 rounded-lg p-3 transition hover:border-[#174ea6]"><span className="flex min-w-0 items-center gap-3"><span className={`portal-icon-tile ${tones[index % tones.length]} size-9 rounded-lg`}><LayoutDashboard className="size-4" aria-hidden /></span><span className="min-w-0"><span className="block truncate text-sm font-black text-[var(--portal-text)]">{action.label}</span><span className="mt-1 block truncate text-xs font-semibold text-[var(--portal-muted)]">{action.description}</span></span></span><ArrowRight className="size-4 shrink-0 text-[#174ea6] dark:text-blue-200" aria-hidden /></Link>)}</CardContent></Card>
      </section>

      {primary?.createFields?.length ? <Card><CardHeader><CardTitle>Create {primary.label.toLowerCase()} record</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Add a live record without leaving the suite control centre.</p></CardHeader><CardContent><OperationsRecordForm workspaceKey={workspaceKey} moduleKey={primary.key} moduleLabel={primary.label} fields={primary.createFields} /></CardContent></Card> : null}

      <Card><CardHeader><CardTitle>Connected workflow map</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Every register below remains available through the same role-protected workspace.</p></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{workspace.modules.map((item) => <Link key={item.key} className="ref-button ref-button-secondary justify-between" href={`/${workspaceKey}/${item.key}`}><span className="flex items-center gap-2"><Boxes className="size-4" aria-hidden />{item.label}</span><span className="font-black">{item.count}</span></Link>)}</div></CardContent></Card>
    </div>
  );
}
