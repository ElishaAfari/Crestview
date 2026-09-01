import type { RoleName } from "@/types/database.types";

type RoleExperience = {
  role: RoleName;
  label: string;
  home: string;
  summary: string;
  access: string[];
};

export const roleExperiences: RoleExperience[] = [
  { role: "super_admin", label: "Head Administrator", home: "/admin", summary: "School-wide oversight and pilot coordination.", access: ["All admin suites", "Access management", "Front office, ID cards, preschool, finance, HR, facilities, reports"] },
  { role: "school_admin", label: "School Administrator", home: "/admin", summary: "Daily academic and operational management.", access: ["Students, staff, admissions and ID cards", "Attendance, grades, exams, preschool and learner care", "Fees, bursary, accounting, facilities, reports and access"] },
  { role: "teacher", label: "Teacher", home: "/teacher", summary: "Classroom delivery and learner progress.", access: ["Classes, attendance and QR registers", "Grades, exams, assignments and reports", "Lesson planner, preschool, extra classes, boarding and learner care"] },
  { role: "student", label: "Student", home: "/student", summary: "Personal learning workspace.", access: ["Assignments", "Attendance and grades", "AI tutor"] },
  { role: "parent", label: "Parent or Guardian", home: "/parent", summary: "Linked-child visibility and school communication.", access: ["Children", "Fees", "Messages"] },
  { role: "hr_staff", label: "HR Staff", home: "/hr", summary: "People operations and recruitment workspace.", access: ["Staff profiles, staff cards and documents", "Leave, recruitment and people tasks", "Front desk, preschool, boarding and learner-care follow-up"] },
  { role: "finance_officer", label: "Finance Officer", home: "/finance", summary: "Billing and finance operations workspace.", access: ["Daily fees, bursary receipts and invoices", "Accounting, expenses, payroll and collections", "Feeding, extra classes, transport, boarding and inventory registers"] },
  { role: "librarian", label: "Librarian", home: "/library", summary: "Library catalog and circulation workspace.", access: ["Catalog and copies", "Loans", "Fines"] },
  { role: "it_support", label: "IT Support", home: "/it", summary: "Technology operations and platform support.", access: ["Devices, ID cards and support tickets", "Integrations, audit and automation", "Communication, transport and inventory systems"] }
];
