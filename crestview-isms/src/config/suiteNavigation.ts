import {
  BookOpen,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { RoleName } from "@/types/database.types";

export type SuiteLink = { title: string; href: string };
export type SuiteGroup = {
  title: string;
  icon: LucideIcon;
  links: SuiteLink[];
};

const adminGroups: SuiteGroup[] = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    links: [
      { title: "Dashboard", href: "/admin" },
      { title: "Reference Dashboard", href: "/dashboard" },
      { title: "Calendar", href: "/calendar" },
    ],
  },
  {
    title: "People",
    icon: Users,
    links: [
      { title: "All Students", href: "/students" },
      { title: "New Student", href: "/students/new" },
      { title: "Enrollments", href: "/students/enrollments" },
      { title: "Promotions", href: "/students/promotions" },
      { title: "Guardians", href: "/students/guardians" },
      { title: "Reports", href: "/students/reports" },
      { title: "All Staff", href: "/staff" },
      { title: "Departments", href: "/staff/departments" },
      { title: "Workload", href: "/staff/workload" },
      { title: "ID Cards", href: "/id-cards" },
      { title: "Card Register", href: "/id-cards/register" },
      { title: "Student Cards", href: "/id-cards/students" },
      { title: "Staff Cards", href: "/id-cards/staff" },
      { title: "Design", href: "/id-cards/design" },
    ],
  },
  {
    title: "Academics",
    icon: BookOpen,
    links: [
      { title: "All Classes", href: "/classes" },
      { title: "Subjects", href: "/classes/subjects" },
      { title: "Timetable", href: "/classes/timetable" },
      { title: "Attendance Overview", href: "/attendance" },
      { title: "Student Attendance", href: "/attendance/mark" },
      { title: "Staff Attendance", href: "/attendance/staff/mark" },
      { title: "Attendance Reports", href: "/attendance/reports" },
      { title: "Assessment Overview", href: "/assessment" },
      { title: "All Exams", href: "/assessment/exams" },
      { title: "Continuous Assessment", href: "/assessment/ca" },
      { title: "CA Schemes", href: "/assessment/ca/schemes" },
      { title: "Moderation", href: "/assessment/moderation" },
      { title: "Report Cards", href: "/assessment/report-cards" },
      { title: "Class Reports", href: "/assessment/broadsheet" },
      { title: "Analytics", href: "/assessment/subject-analysis" },
      { title: "External Exams", href: "/assessment/external" },
      { title: "AI Jobs", href: "/assessment/ai-jobs" },
      { title: "Audit Log", href: "/assessment/audit-log" },
      { title: "Schemes of Learning", href: "/academics-office/schemes" },
      { title: "Scheme Coverage", href: "/academics/schemes?tab=coverage" },
      { title: "Examinations", href: "/exams" },
    ],
  },
  {
    title: "Admissions",
    icon: UserCheck,
    links: [
      { title: "Overview", href: "/admissions-office" },
      { title: "Public Admissions", href: "/admissions" },
      { title: "Inquiries", href: "/admissions/inquiries" },
      { title: "Follow-ups", href: "/admissions/inquiries/follow-ups" },
      { title: "Applications", href: "/admissions/applications" },
      { title: "Interviews", href: "/admissions/interviews" },
      { title: "Decisions", href: "/admissions/decisions" },
      { title: "Enrollment", href: "/admissions/enrollment" },
      { title: "Return Intents", href: "/admissions/return-intents" },
      { title: "Analytics", href: "/admissions/analytics" },
      { title: "Periods", href: "/admissions/periods" },
      { title: "Entrance Exams", href: "/admissions/exams" },
      { title: "Events & Tours", href: "/admissions/events" },
      { title: "Fee Waivers", href: "/admissions/fee-waivers" },
      { title: "Capacity", href: "/admissions/capacity" },
      { title: "CSSPS Import", href: "/admissions/cssps" },
    ],
  },
  {
    title: "Preschool",
    icon: GraduationCap,
    links: [
      { title: "Overview", href: "/preschool" },
      { title: "Daily Logs", href: "/preschool/daily-logs" },
      { title: "Observations", href: "/preschool/observations" },
      { title: "Assessments", href: "/preschool/assessment" },
      { title: "Pickups", href: "/preschool/pickups" },
      { title: "Incidents", href: "/preschool/incidents" },
      { title: "Portfolio", href: "/preschool/portfolio" },
      { title: "Timeline", href: "/preschool/timeline" },
      { title: "Reports", href: "/preschool/reports" },
      { title: "Settings", href: "/settings/preschool" },
    ],
  },
  {
    title: "Finance",
    icon: CreditCard,
    links: [
      { title: "Fees & Billing", href: "/finance" },
      { title: "Fee Structures", href: "/finance/fee-structures" },
      { title: "Invoices", href: "/finance/invoices" },
      { title: "Payments", href: "/finance/payments" },
      { title: "Record Payment", href: "/finance/payments/record" },
      { title: "Scholarships", href: "/finance/scholarships" },
      { title: "Credit Notes", href: "/finance/credit-notes" },
      { title: "Fee Types", href: "/finance/fee-types" },
      { title: "Reports", href: "/finance/reports" },
      { title: "Audit Log", href: "/finance/audit" },
      { title: "Approvals", href: "/finance/approvals" },
      { title: "Opening Balances", href: "/finance/opening-balances" },
      { title: "Cashier Desk", href: "/bursary/desk" },
      { title: "Bursary Sessions", href: "/bursary/sessions" },
      { title: "Receipts", href: "/bursary/receipts" },
      { title: "Bursary Reports", href: "/bursary/reports" },
      { title: "Accounting", href: "/accounting" },
      { title: "Chart of Accounts", href: "/accounting/accounts" },
      { title: "Revenue Overrides", href: "/accounting/revenue-overrides" },
      { title: "Journal Entries", href: "/accounting/journal-entries" },
      { title: "Expenses", href: "/accounting/expenses" },
      { title: "Supplier Bills", href: "/accounting/supplier-bills" },
      { title: "Vendors", href: "/accounting/vendors" },
      { title: "Bank Accounts", href: "/accounting/bank-accounts" },
      { title: "Fiscal Years", href: "/accounting/fiscal-years" },
      { title: "Depreciation", href: "/accounting/depreciation" },
      { title: "Ledger Health", href: "/accounting/ledger-health" },
      { title: "Accounting Reports", href: "/accounting/reports" },
      { title: "Feeding", href: "/feeding" },
      { title: "Feeding Monitor", href: "/feeding/monitor" },
      { title: "Feeding Collections", href: "/feeding/collections" },
      { title: "Feeding Remittances", href: "/feeding/remittances" },
      { title: "Feeding Payments", href: "/feeding/payments" },
      { title: "Feeding Wallets", href: "/feeding/students" },
      { title: "Feeding Exemptions", href: "/feeding/exemptions" },
      { title: "Feeding Pause Requests", href: "/feeding/pause-requests" },
      { title: "Feeding Refund Requests", href: "/feeding/refund-requests" },
      { title: "Feeding Reconciliation", href: "/feeding/reconciliation" },
      { title: "Feeding Reports", href: "/feeding/reports" },
      { title: "Feeding Settings", href: "/settings/feeding" },
      { title: "Extra Classes", href: "/extra-classes" },
      { title: "Extra Class Monitor", href: "/extra-classes/monitor" },
      { title: "Extra Class Collections", href: "/extra-classes/collections" },
      { title: "Extra Class Remittances", href: "/extra-classes/remittances" },
      { title: "Extra Class Payments", href: "/extra-classes/payments" },
      { title: "Extra Class Wallets", href: "/extra-classes/students" },
      { title: "Extra Class Exemptions", href: "/extra-classes/exemptions" },
      {
        title: "Extra Class Pause Requests",
        href: "/extra-classes/pause-requests",
      },
      {
        title: "Extra Class Refund Requests",
        href: "/extra-classes/refund-requests",
      },
      {
        title: "Extra Class Reconciliation",
        href: "/extra-classes/reconciliation",
      },
      { title: "Extra Class Reports", href: "/extra-classes/reports" },
      { title: "Extra Class Settings", href: "/settings/extra-classes" },
    ],
  },
  {
    title: "HR & Payroll",
    icon: Users,
    links: [
      { title: "Leave Requests", href: "/hr/leave/requests" },
      { title: "My Leave", href: "/hr/leave/my-requests" },
      { title: "Leave Calendar", href: "/hr/leave/calendar" },
      { title: "Leave Balances", href: "/hr/leave/balances" },
      { title: "Leave Types", href: "/hr/leave/types" },
      { title: "Staff Profiles", href: "/hr/staff" },
      { title: "Payroll", href: "/hr/payroll" },
      { title: "Recruitment", href: "/admin/recruitment" },
    ],
  },
  {
    title: "Facilities",
    icon: Boxes,
    links: [
      { title: "Boarding", href: "/boarding" },
      { title: "Transport", href: "/transport" },
      { title: "Inventory", href: "/inventory" },
      { title: "Assets", href: "/inventory/assets" },
      { title: "Scan", href: "/inventory/scan" },
      { title: "Stock", href: "/inventory/stock" },
      { title: "Stock Takes", href: "/inventory/stock/takes" },
      { title: "Categories", href: "/inventory/categories" },
      { title: "Locations", href: "/inventory/locations" },
      { title: "Maintenance", href: "/inventory/maintenance" },
      {
        title: "Maintenance Schedules",
        href: "/inventory/maintenance-schedules",
      },
      { title: "Disposals", href: "/inventory/disposals" },
      { title: "Inventory Reports", href: "/inventory/reports" },
      { title: "Requisitions", href: "/stores/requisitions" },
      { title: "Transfers", href: "/stores/transfers" },
    ],
  },
  {
    title: "Communication",
    icon: MessageSquare,
    links: [
      { title: "Messages", href: "/messages" },
      { title: "SMS", href: "/messages/sms" },
      { title: "Email", href: "/messages/email" },
      { title: "Templates", href: "/messages/templates" },
      { title: "Groups", href: "/messages/groups" },
      { title: "Announcements", href: "/messages/announcements" },
      { title: "Notifications", href: "/notifications" },
      { title: "Threads", href: "/messages/threads" },
      { title: "Meetings", href: "/messages/meetings" },
      { title: "Teacher Notes", href: "/teacher-notes" },
      { title: "History", href: "/messages/history" },
    ],
  },
  {
    title: "Reports",
    icon: FileText,
    links: [
      { title: "Overview", href: "/reports" },
      { title: "Academic", href: "/reports/academic" },
      { title: "Financial", href: "/reports/financial" },
      { title: "Attendance", href: "/attendance/reports" },
      { title: "HR & Payroll", href: "/reports/hr-payroll" },
      { title: "Boarding", href: "/reports/boarding" },
      { title: "Inventory", href: "/reports/inventory" },
      { title: "Platform Audit", href: "/platform-audit" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    links: [
      { title: "Settings", href: "/admin/settings" },
      { title: "Reference Settings", href: "/settings" },
      { title: "User Access", href: "/admin/access" },
      { title: "Automation", href: "/admin/automation" },
      { title: "Help Desk", href: "/help" },
    ],
  },
];

const roleGroups: Record<
  Exclude<RoleName, "super_admin" | "school_owner" | "school_admin">,
  SuiteGroup[]
> = {
  teacher: [
    {
      title: "Overview",
      icon: LayoutDashboard,
      links: [
        { title: "Dashboard", href: "/teacher" },
        { title: "Calendar", href: "/events" },
      ],
    },
    {
      title: "Teaching",
      icon: BookOpen,
      links: [
        { title: "Classes", href: "/teacher/classes" },
        { title: "Attendance", href: "/teacher/attendance" },
        { title: "Grades", href: "/teacher/grades" },
        { title: "Assignments", href: "/teacher/assignments" },
        { title: "Lesson Planner", href: "/teacher/lesson-planner" },
        { title: "Examinations", href: "/exams" },
        { title: "Student 360", href: "/teacher/student-360" },
      ],
    },
    {
      title: "Support",
      icon: ClipboardCheck,
      links: [
        { title: "Learner Care", href: "/learner-care" },
        { title: "Preschool", href: "/preschool" },
        { title: "Extra Classes", href: "/extra-classes" },
      ],
    },
  ],
  student: [
    {
      title: "Overview",
      icon: LayoutDashboard,
      links: [
        { title: "Dashboard", href: "/student" },
        { title: "Calendar", href: "/events" },
      ],
    },
    {
      title: "Learning",
      icon: BookOpen,
      links: [
        { title: "Assignments", href: "/student/assignments" },
        { title: "Attendance", href: "/student/attendance" },
        { title: "Grades", href: "/student/grades" },
        { title: "Reports", href: "/student/reports" },
        { title: "AI Tutor", href: "/student/ai-tutor" },
      ],
    },
  ],
  parent: [
    {
      title: "Overview",
      icon: LayoutDashboard,
      links: [
        { title: "Dashboard", href: "/parent" },
        { title: "Calendar", href: "/events" },
      ],
    },
    {
      title: "Family",
      icon: GraduationCap,
      links: [
        { title: "Children", href: "/parent/children" },
        { title: "Fees", href: "/parent/fees" },
        { title: "Reports", href: "/parent/reports" },
        { title: "Messages", href: "/parent/messages" },
      ],
    },
  ],
  hr_staff: [
    {
      title: "Overview",
      icon: LayoutDashboard,
      links: [
        { title: "Dashboard", href: "/hr" },
        { title: "Calendar", href: "/events" },
      ],
    },
    {
      title: "People",
      icon: Users,
      links: [
        { title: "Staff Profiles", href: "/hr/staff" },
        { title: "Leave", href: "/hr/leave" },
        { title: "Recruitment", href: "/hr/recruitment" },
        { title: "Documents", href: "/hr/documents" },
      ],
    },
    {
      title: "Operations",
      icon: ClipboardList,
      links: [
        { title: "Payroll", href: "/hr/payroll" },
        { title: "ID Cards", href: "/id-cards" },
        { title: "Learner Care", href: "/learner-care" },
      ],
    },
  ],
  finance_officer: [
    {
      title: "Overview",
      icon: LayoutDashboard,
      links: [
        { title: "Dashboard", href: "/finance" },
        { title: "Calendar", href: "/events" },
      ],
    },
    {
      title: "Finance",
      icon: CreditCard,
      links: [
        { title: "Daily Payments", href: "/finance/payments" },
        { title: "Billing Batches", href: "/finance/billing-batches" },
        { title: "Invoices", href: "/finance/invoices" },
        { title: "Collections", href: "/finance/collections" },
        { title: "Bursary", href: "/bursary" },
        { title: "Accounting", href: "/accounting" },
        { title: "Expenses", href: "/finance/expenses" },
      ],
    },
    {
      title: "Facilities",
      icon: Boxes,
      links: [
        { title: "Feeding", href: "/feeding" },
        { title: "Transport", href: "/transport" },
        { title: "Inventory", href: "/inventory" },
      ],
    },
  ],
  librarian: [
    {
      title: "Overview",
      icon: LayoutDashboard,
      links: [
        { title: "Dashboard", href: "/library" },
        { title: "Calendar", href: "/events" },
      ],
    },
    {
      title: "Library",
      icon: BookOpen,
      links: [
        { title: "Catalog", href: "/library/catalog" },
        { title: "Copies", href: "/library/copies" },
        { title: "Loans", href: "/library/loans" },
        { title: "Fines", href: "/library/fines" },
        { title: "Tasks", href: "/library/library-tasks" },
      ],
    },
  ],
  it_support: [
    {
      title: "Overview",
      icon: LayoutDashboard,
      links: [
        { title: "Dashboard", href: "/it" },
        { title: "Calendar", href: "/events" },
      ],
    },
    {
      title: "Technology",
      icon: Settings,
      links: [
        { title: "Devices", href: "/it/devices" },
        { title: "Tickets", href: "/it/tickets" },
        { title: "Integrations", href: "/it/integrations" },
        { title: "Automation", href: "/it/automation" },
        { title: "Messages", href: "/it/messages" },
        { title: "Audit Log", href: "/it/audit" },
        { title: "Platform Audit", href: "/platform-audit" },
      ],
    },
    {
      title: "Facilities",
      icon: Boxes,
      links: [
        { title: "Transport", href: "/transport" },
        { title: "Inventory", href: "/inventory" },
      ],
    },
  ],
};

export function getSuiteNavigation(role: RoleName | null) {
  if (
    role === "super_admin" ||
    role === "school_owner" ||
    role === "school_admin"
  )
    return adminGroups;
  return role
    ? (roleGroups[
        role as Exclude<
          RoleName,
          "super_admin" | "school_owner" | "school_admin"
        >
      ] ?? [])
    : [];
}
