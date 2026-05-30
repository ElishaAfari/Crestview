import type { RoleName } from "@/types/database.types";

type RoleExperience = {
  role: RoleName;
  label: string;
  home: string;
  summary: string;
  access: string[];
};

export const roleExperiences: RoleExperience[] = [
  { role: "super_admin", label: "Head Administrator", home: "/admin", summary: "School-wide oversight and beta coordination.", access: ["All admin suites", "Access management", "Settings and reports"] },
  { role: "school_admin", label: "School Administrator", home: "/admin", summary: "Daily academic and operational management.", access: ["Students and staff", "Attendance and grades", "Fees, reports, and access"] },
  { role: "teacher", label: "Teacher", home: "/teacher", summary: "Classroom delivery and learner progress.", access: ["Classes and attendance", "Grades and assignments", "Lesson planner"] },
  { role: "student", label: "Student", home: "/student", summary: "Personal learning workspace.", access: ["Assignments", "Attendance and grades", "AI tutor"] },
  { role: "parent", label: "Parent or Guardian", home: "/parent", summary: "Linked-child visibility and school communication.", access: ["Children", "Fees", "Messages"] },
  { role: "hr_staff", label: "HR Staff", home: "/admin", summary: "Staff-focused operational access.", access: ["Staff directory", "Dashboard", "Calendar"] },
  { role: "finance_officer", label: "Finance Officer", home: "/admin/fees", summary: "Billing and fee operations.", access: ["Fees and invoices", "Dashboard", "Calendar"] },
  { role: "librarian", label: "Librarian", home: "/admin", summary: "Library-facing operational account.", access: ["Dashboard", "Calendar"] },
  { role: "it_support", label: "IT Support", home: "/admin/settings", summary: "Platform support and settings.", access: ["Settings", "Dashboard", "Calendar"] }
];
