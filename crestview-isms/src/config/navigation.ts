import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Users
} from "lucide-react";
import type { NavItem } from "@/types/ui.types";

export const navigationItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["super_admin", "school_admin", "hr_staff", "finance_officer", "it_support", "librarian"] },
  { title: "Students", href: "/admin/students", icon: GraduationCap, roles: ["super_admin", "school_admin"] },
  { title: "Staff", href: "/admin/staff", icon: Users, roles: ["super_admin", "school_admin", "hr_staff"] },
  { title: "Attendance", href: "/admin/attendance", icon: ClipboardCheck, roles: ["super_admin", "school_admin"] },
  { title: "Grades", href: "/admin/grades", icon: BarChart3, roles: ["super_admin", "school_admin"] },
  { title: "Fees", href: "/admin/fees", icon: CreditCard, roles: ["super_admin", "school_admin", "finance_officer"] },
  { title: "Reports", href: "/admin/reports", icon: FileText, roles: ["super_admin", "school_admin"] },
  { title: "Settings", href: "/admin/settings", icon: Settings, roles: ["super_admin", "school_admin", "it_support"] },

  { title: "Dashboard", href: "/teacher", icon: LayoutDashboard, roles: ["teacher"] },
  { title: "Classes", href: "/teacher/classes", icon: BookOpen, roles: ["teacher"] },
  { title: "Attendance", href: "/teacher/attendance", icon: ClipboardCheck, roles: ["teacher"] },
  { title: "Grades", href: "/teacher/grades", icon: BarChart3, roles: ["teacher"] },
  { title: "Assignments", href: "/teacher/assignments", icon: FileText, roles: ["teacher"] },
  { title: "Lesson Planner", href: "/teacher/lesson-planner", icon: Sparkles, roles: ["teacher"] },

  { title: "Dashboard", href: "/student", icon: LayoutDashboard, roles: ["student"] },
  { title: "Assignments", href: "/student/assignments", icon: FileText, roles: ["student"] },
  { title: "Attendance", href: "/student/attendance", icon: ClipboardCheck, roles: ["student"] },
  { title: "Grades", href: "/student/grades", icon: BarChart3, roles: ["student"] },
  { title: "AI Tutor", href: "/student/ai-tutor", icon: Sparkles, roles: ["student"] },

  { title: "Dashboard", href: "/parent", icon: LayoutDashboard, roles: ["parent"] },
  { title: "Children", href: "/parent/children", icon: GraduationCap, roles: ["parent"] },
  { title: "Fees", href: "/parent/fees", icon: CreditCard, roles: ["parent"] },
  { title: "Messages", href: "/parent/messages", icon: MessageSquare, roles: ["parent"] },

  { title: "Calendar", href: "/events", icon: CalendarDays, roles: ["super_admin", "school_admin", "teacher", "student", "parent", "hr_staff", "finance_officer", "it_support", "librarian"] }
];
