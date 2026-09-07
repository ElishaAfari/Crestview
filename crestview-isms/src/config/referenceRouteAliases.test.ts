import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findOperationsWorkspace } from "./operations";
import { referenceRouteAliases } from "./referenceRouteAliases";
import { getSuiteNavigation } from "./suiteNavigation";
import type { RoleName } from "@/types/database.types";

const referenceMenuRoutes = [
  "/dashboard",
  "/calendar",
  "/students",
  "/students/enrollments",
  "/students/promotions",
  "/students/guardians",
  "/students/reports",
  "/staff",
  "/staff/departments",
  "/staff/workload",
  "/id-cards",
  "/id-cards/register",
  "/id-cards/students",
  "/id-cards/staff",
  "/id-cards/design",
  "/classes",
  "/classes/subjects",
  "/classes/timetable",
  "/attendance",
  "/attendance/mark",
  "/attendance/staff/mark",
  "/attendance/reports",
  "/assessment",
  "/assessment/exams",
  "/assessment/ca",
  "/assessment/ca/schemes",
  "/assessment/moderation",
  "/assessment/report-cards",
  "/assessment/broadsheet",
  "/assessment/subject-analysis",
  "/assessment/external",
  "/assessment/ai-jobs",
  "/assessment/audit-log",
  "/academics/schemes",
  "/academics/schemes?tab=coverage",
  "/admissions",
  "/admissions/inquiries",
  "/admissions/inquiries/follow-ups",
  "/admissions/applications",
  "/admissions/interviews",
  "/admissions/decisions",
  "/admissions/enrollment",
  "/admissions/return-intents",
  "/admissions/analytics",
  "/admissions/periods",
  "/admissions/exams",
  "/admissions/events",
  "/admissions/fee-waivers",
  "/admissions/capacity",
  "/admissions/cssps",
  "/preschool",
  "/preschool/daily-logs",
  "/preschool/observations",
  "/preschool/assessment",
  "/preschool/pickups",
  "/preschool/incidents",
  "/preschool/portfolio",
  "/preschool/timeline",
  "/preschool/reports",
  "/settings/preschool",
  "/finance",
  "/finance/fee-structures",
  "/finance/invoices",
  "/finance/payments",
  "/finance/scholarships",
  "/finance/credit-notes",
  "/finance/fee-types",
  "/finance/reports",
  "/finance/audit",
  "/finance/approvals",
  "/finance/opening-balances",
  "/bursary/desk",
  "/bursary/sessions",
  "/bursary/receipts",
  "/bursary/reports",
  "/accounting",
  "/accounting/accounts",
  "/accounting/revenue-overrides",
  "/accounting/journal-entries",
  "/accounting/expenses",
  "/accounting/supplier-bills",
  "/accounting/vendors",
  "/accounting/bank-accounts",
  "/accounting/fiscal-years",
  "/accounting/depreciation",
  "/accounting/ledger-health",
  "/accounting/reports",
  "/feeding",
  "/feeding/monitor",
  "/feeding/collections",
  "/feeding/remittances",
  "/feeding/payments",
  "/feeding/students",
  "/feeding/exemptions",
  "/feeding/pause-requests",
  "/feeding/refund-requests",
  "/feeding/reconciliation",
  "/feeding/reports",
  "/settings/feeding",
  "/extra-classes",
  "/extra-classes/monitor",
  "/extra-classes/collections",
  "/extra-classes/remittances",
  "/extra-classes/payments",
  "/extra-classes/students",
  "/extra-classes/exemptions",
  "/extra-classes/pause-requests",
  "/extra-classes/refund-requests",
  "/extra-classes/reconciliation",
  "/extra-classes/reports",
  "/settings/extra-classes",
  "/hr/leave/requests",
  "/hr/leave/my-requests",
  "/hr/leave/calendar",
  "/hr/leave/balances",
  "/hr/leave/types",
  "/inventory",
  "/inventory/assets",
  "/inventory/scan",
  "/inventory/stock",
  "/inventory/stock/takes",
  "/inventory/categories",
  "/inventory/locations",
  "/inventory/maintenance",
  "/inventory/maintenance-schedules",
  "/inventory/disposals",
  "/inventory/reports",
  "/stores/requisitions",
  "/stores/transfers",
  "/messages",
  "/messages/sms",
  "/messages/email",
  "/messages/templates",
  "/messages/groups",
  "/messages/announcements",
  "/notifications",
  "/messages/threads",
  "/messages/meetings",
  "/teacher-notes",
  "/messages/history",
  "/reports",
  "/reports/academic",
  "/reports/financial",
  "/reports/hr-payroll",
  "/reports/boarding",
  "/reports/inventory",
  "/settings",
  "/help",
  "/students/new",
  "/finance/payments/record",
];

function withoutQuery(route: string) {
  return route.split("?")[0] ?? route;
}

function hasStaticPage(route: string) {
  const segments = withoutQuery(route).split("/").filter(Boolean);
  const roots = ["(dashboard)", "(public)", "(auth)"];
  return roots.some((root) =>
    existsSync(
      path.join(process.cwd(), "src", "app", root, ...segments, "page.tsx"),
    ),
  );
}

function hasOperationsRoute(route: string) {
  const [workspaceKey, moduleKey] = withoutQuery(route)
    .split("/")
    .filter(Boolean);
  if (!workspaceKey) return false;
  const workspace = findOperationsWorkspace(workspaceKey);
  if (!workspace) return false;
  if (!moduleKey) return true;
  return workspace.modules.some((module) => module.key === moduleKey);
}

function isRoutable(route: string): boolean {
  const normalized = withoutQuery(route);
  const aliasDestination = referenceRouteAliases[normalized];
  if (aliasDestination) return isRoutable(aliasDestination);
  return hasStaticPage(normalized) || hasOperationsRoute(normalized);
}

describe("reference route parity", () => {
  it("keeps every configured alias pointed at a real page or operations register", () => {
    const brokenAliases = Object.entries(referenceRouteAliases)
      .filter(([, destination]) => !isRoutable(destination))
      .map(([source, destination]) => `${source} -> ${destination}`);

    expect(brokenAliases).toEqual([]);
  });

  it("covers the reference-style navigation paths with pages or aliases", () => {
    const missingRoutes = referenceMenuRoutes.filter(
      (route) => !isRoutable(route),
    );

    expect(missingRoutes).toEqual([]);
  });

  it("keeps role suite navigation linked to real destinations", () => {
    const roles: RoleName[] = [
      "super_admin",
      "school_admin",
      "teacher",
      "student",
      "parent",
      "hr_staff",
      "finance_officer",
      "it_support",
      "librarian",
    ];
    const missingRoutes = roles.flatMap((role) =>
      getSuiteNavigation(role).flatMap((group) =>
        group.links
          .filter((link) => !isRoutable(link.href))
          .map((link) => `${role}:${group.title}:${link.title}:${link.href}`),
      ),
    );

    expect(missingRoutes).toEqual([]);
  });
});
