import { AutomationRunControls } from "@/components/automation/AutomationRunControls";
import { WorkflowTaskForm } from "@/components/forms/WorkflowTaskForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WorkflowTaskTable } from "@/components/tables/WorkflowTaskTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkflowSummary, listAutomationRules, listTaskFormOptions, listWorkflowTasksForCurrentRole } from "@/features/automation/queries";
import { AlertOctagon, CheckCircle2, Clock3, ListChecks } from "lucide-react";

export default async function AdminAutomationPage() {
  const [tasks, rules, summary, options] = await Promise.all([
    listWorkflowTasksForCurrentRole(120),
    listAutomationRules(),
    getWorkflowSummary(),
    listTaskFormOptions()
  ]);

  return (
    <PageWrapper title="Automation Center" description="Track school-wide workflow tasks, automation rules, follow-ups, and operating-system jobs from one control room.">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Open tasks", value: summary.open, accent: "portal-accent-blue", tone: "portal-tone-blue", icon: ListChecks },
          { label: "Urgent", value: summary.urgent, accent: "portal-accent-red", tone: "portal-tone-red", icon: AlertOctagon },
          { label: "Blocked", value: summary.blocked, accent: "portal-accent-amber", tone: "portal-tone-amber", icon: Clock3 },
          { label: "Completed", value: summary.completed, accent: "portal-accent-green", tone: "portal-tone-green", icon: CheckCircle2 }
        ].map(({ label, value, accent, tone, icon: Icon }) => (
          <Card key={label} className={`portal-metric-card ${accent} overflow-hidden`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--portal-muted)]">{label}</p>
                  <p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{value}</p>
                </div>
                <span className={`portal-icon-tile ${tone} size-12 rounded-lg`}>
                  <Icon className="size-5 stroke-[2.5]" aria-hidden />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader><CardTitle>Run Backend Automations</CardTitle></CardHeader>
        <CardContent><AutomationRunControls /></CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <Card>
          <CardHeader><CardTitle>Create Task</CardTitle></CardHeader>
          <CardContent><WorkflowTaskForm {...options} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Workflow Tasks</CardTitle></CardHeader>
          <CardContent><WorkflowTaskTable data={tasks} /></CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Active Automation Rules</CardTitle></CardHeader>
        <CardContent>
          <div className="portal-table-wrap">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="portal-table-head text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Rule</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Last triggered</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="portal-table-row">
                    <td className="px-4 py-3">
                      <p className="font-black text-[var(--portal-text)]">{rule.name}</p>
                      <p className="max-w-lg text-xs font-semibold text-[var(--portal-muted)]">{rule.description}</p>
                    </td>
                    <td className="px-4 py-3 font-black text-[var(--portal-text)]">{rule.eventKey}</td>
                    <td className="px-4 py-3 font-semibold capitalize text-[var(--portal-text)]">{rule.scope}</td>
                    <td className="px-4 py-3"><StatusBadge status={rule.status} /></td>
                    <td className="px-4 py-3 font-black text-[var(--portal-text)]">{rule.priority}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--portal-muted)]">{rule.lastTriggeredAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
