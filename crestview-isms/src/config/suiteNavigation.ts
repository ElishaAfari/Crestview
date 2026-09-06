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
  type LucideIcon
} from "lucide-react";
import type { RoleName } from "@/types/database.types";

export type SuiteLink = { title: string; href: string };
export type SuiteGroup = { title: string; icon: LucideIcon; links: SuiteLink[] };

const adminGroups: SuiteGroup[] = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    links: [
      { title: "Dashboard", href: "/admin" },
      { title: "Calendar", href: "/calendar" }
    ]
  },
  {
    title: "People",
    icon: Users,
    links: [
      { title: "All Students", href: "/students" },
      { title: "Enrollments", href: "/students/student-directory?view=enrollments" },
      { title: "Promotions", href: "/students/academic-reports?view=promotions" },
      { title: "Guardians", href: "/students/guardian-links" },
      { title: "Reports", href: "/students/academic-reports" },
      { title: "All Staff", href: "/staff" },
      { title: "Departments", href: "/staff/staff-directory?view=departments" },
      { title: "Workload", href: "/staff/class-assignments" },
      { title: "ID Cards", href: "/id-cards" },
      { title: "Card Register", href: "/id-cards" },
      { title: "Verification Log", href: "/id-cards/verifications" }
    ]
  },
  {
    title: "Academics",
    icon: BookOpen,
    links: [
      { title: "All Classes", href: "/classes" },
      { title: "Subjects", href: "/classes/subject-coverage" },
      { title: "Timetable", href: "/classes/timetable" },
      { title: "Attendance Overview", href: "/attendance" },
      { title: "Student Attendance", href: "/attendance/student-records" },
      { title: "Staff Attendance", href: "/attendance/daily-registers" },
      { title: "Attendance Reports", href: "/attendance/follow-up" },
      { title: "Assessment Overview", href: "/assessment" },
      { title: "Assessment Items", href: "/assessment/assessment-items" },
      { title: "Continuous Assessment", href: "/assessment/marks-register" },
      { title: "Report Cards", href: "/assessment/report-cards" },
      { title: "Class Reports", href: "/assessment/report-cards" },
      { title: "Schemes of Learning", href: "/academics-office/schemes" },
      { title: "Examinations", href: "/exams" }
    ]
  },
  {
    title: "Admissions",
    icon: UserCheck,
    links: [
      { title: "Overview", href: "/admissions-office" },
      { title: "Inquiries", href: "/admissions-office/inquiries" },
      { title: "Applications", href: "/admissions-office/applications" },
      { title: "Decisions", href: "/admin/admissions" },
      { title: "Enrollment", href: "/admissions-office/onboarding-tasks" },
      { title: "Admissions Analytics", href: "/reports" }
    ]
  },
  {
    title: "Preschool",
    icon: GraduationCap,
    links: [
      { title: "Overview", href: "/preschool" },
      { title: "Daily Logs", href: "/preschool/daily-logs" },
      { title: "Observations", href: "/preschool/observations" },
      { title: "Pickups", href: "/preschool/pickups" },
      { title: "Incidents", href: "/preschool/incidents" },
      { title: "Portfolio", href: "/preschool/observations" },
      { title: "Reports", href: "/preschool/daily-logs" }
    ]
  },
  {
    title: "Finance",
    icon: CreditCard,
    links: [
      { title: "Fees & Billing", href: "/finance" },
      { title: "Fee Structures", href: "/finance/billing-batches" },
      { title: "Invoices", href: "/finance/invoices" },
      { title: "Payments", href: "/finance/payments" },
      { title: "Bursary", href: "/bursary" },
      { title: "Accounting", href: "/accounting" },
      { title: "Feeding", href: "/feeding" },
      { title: "Extra Classes", href: "/extra-classes" }
    ]
  },
  {
    title: "HR & Payroll",
    icon: Users,
    links: [
      { title: "Leave Requests", href: "/hr/leave" },
      { title: "Staff Profiles", href: "/hr/staff" },
      { title: "Payroll", href: "/hr/payroll" },
      { title: "Recruitment", href: "/admin/recruitment" }
    ]
  },
  {
    title: "Facilities",
    icon: Boxes,
    links: [
      { title: "Boarding", href: "/boarding" },
      { title: "Transport", href: "/transport" },
      { title: "Inventory", href: "/inventory" }
    ]
  },
  {
    title: "Communication",
    icon: MessageSquare,
    links: [
      { title: "Messages", href: "/messages" },
      { title: "Announcements", href: "/communication/announcements" },
      { title: "Campaigns", href: "/communication/campaigns" },
      { title: "Email Queue", href: "/communication/email-queue" },
      { title: "SMS Queue", href: "/communication/sms-queue" }
    ]
  },
  {
    title: "Reports",
    icon: FileText,
    links: [
      { title: "Overview", href: "/reports" },
      { title: "Academic", href: "/reports/report-cards" },
      { title: "Financial", href: "/reports/fee-collection" },
      { title: "Attendance", href: "/reports/attendance-trend" },
      { title: "Platform Audit", href: "/platform-audit" }
    ]
  },
  {
    title: "Settings",
    icon: Settings,
    links: [
      { title: "Settings", href: "/admin/settings" },
      { title: "User Access", href: "/admin/access" },
      { title: "Automation", href: "/admin/automation" }
    ]
  }
];

const roleGroups: Record<Exclude<RoleName, "super_admin" | "school_admin">, SuiteGroup[]> = {
  teacher: [
    { title: "Overview", icon: LayoutDashboard, links: [{ title: "Dashboard", href: "/teacher" }, { title: "Calendar", href: "/events" }] },
    { title: "Teaching", icon: BookOpen, links: [{ title: "Classes", href: "/teacher/classes" }, { title: "Attendance", href: "/teacher/attendance" }, { title: "Grades", href: "/teacher/grades" }, { title: "Assignments", href: "/teacher/assignments" }, { title: "Lesson Planner", href: "/teacher/lesson-planner" }, { title: "Examinations", href: "/exams" }, { title: "Student 360", href: "/teacher/student-360" }] },
    { title: "Support", icon: ClipboardCheck, links: [{ title: "Learner Care", href: "/learner-care" }, { title: "Preschool", href: "/preschool" }, { title: "Extra Classes", href: "/extra-classes" }] }
  ],
  student: [
    { title: "Overview", icon: LayoutDashboard, links: [{ title: "Dashboard", href: "/student" }, { title: "Calendar", href: "/events" }] },
    { title: "Learning", icon: BookOpen, links: [{ title: "Assignments", href: "/student/assignments" }, { title: "Attendance", href: "/student/attendance" }, { title: "Grades", href: "/student/grades" }, { title: "Reports", href: "/student/reports" }, { title: "AI Tutor", href: "/student/ai-tutor" }] }
  ],
  parent: [
    { title: "Overview", icon: LayoutDashboard, links: [{ title: "Dashboard", href: "/parent" }, { title: "Calendar", href: "/events" }] },
    { title: "Family", icon: GraduationCap, links: [{ title: "Children", href: "/parent/children" }, { title: "Fees", href: "/parent/fees" }, { title: "Reports", href: "/parent/reports" }, { title: "Messages", href: "/parent/messages" }] }
  ],
  hr_staff: [
    { title: "Overview", icon: LayoutDashboard, links: [{ title: "Dashboard", href: "/hr" }, { title: "Calendar", href: "/events" }] },
    { title: "People", icon: Users, links: [{ title: "Staff Profiles", href: "/hr/staff" }, { title: "Leave", href: "/hr/leave" }, { title: "Recruitment", href: "/hr/recruitment" }, { title: "Documents", href: "/hr/documents" }] },
    { title: "Operations", icon: ClipboardList, links: [{ title: "Payroll", href: "/hr/payroll" }, { title: "ID Cards", href: "/id-cards" }, { title: "Learner Care", href: "/learner-care" }] }
  ],
  finance_officer: [
    { title: "Overview", icon: LayoutDashboard, links: [{ title: "Dashboard", href: "/finance" }, { title: "Calendar", href: "/events" }] },
    { title: "Finance", icon: CreditCard, links: [{ title: "Daily Payments", href: "/finance/payments" }, { title: "Billing Batches", href: "/finance/billing-batches" }, { title: "Invoices", href: "/finance/invoices" }, { title: "Collections", href: "/finance/collections" }, { title: "Bursary", href: "/bursary" }, { title: "Accounting", href: "/accounting" }, { title: "Expenses", href: "/finance/expenses" }] },
    { title: "Facilities", icon: Boxes, links: [{ title: "Feeding", href: "/feeding" }, { title: "Transport", href: "/transport" }, { title: "Inventory", href: "/inventory" }] }
  ],
  librarian: [
    { title: "Overview", icon: LayoutDashboard, links: [{ title: "Dashboard", href: "/library" }, { title: "Calendar", href: "/events" }] },
    { title: "Library", icon: BookOpen, links: [{ title: "Catalog", href: "/library/catalog" }, { title: "Copies", href: "/library/copies" }, { title: "Loans", href: "/library/loans" }, { title: "Fines", href: "/library/fines" }, { title: "Tasks", href: "/library/library-tasks" }] }
  ],
  it_support: [
    { title: "Overview", icon: LayoutDashboard, links: [{ title: "Dashboard", href: "/it" }, { title: "Calendar", href: "/events" }] },
    { title: "Technology", icon: Settings, links: [{ title: "Devices", href: "/it/devices" }, { title: "Tickets", href: "/it/tickets" }, { title: "Integrations", href: "/it/integrations" }, { title: "Automation", href: "/it/automation" }, { title: "Messages", href: "/it/messages" }, { title: "Audit Log", href: "/it/audit" }, { title: "Platform Audit", href: "/platform-audit" }] },
    { title: "Facilities", icon: Boxes, links: [{ title: "Transport", href: "/transport" }, { title: "Inventory", href: "/inventory" }] }
  ]
};

export function getSuiteNavigation(role: RoleName | null) {
  if (role === "super_admin" || role === "school_admin") return adminGroups;
  return role ? roleGroups[role as Exclude<RoleName, "super_admin" | "school_admin">] ?? [] : [];
}
