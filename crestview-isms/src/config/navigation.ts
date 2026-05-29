import {
  BarChart3,
  Bell,
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
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["super_admin", "school_admin", "hr_staff", "finance_officer", "it_support"] },
  { title: "Students", href: "/admin/students", icon: GraduationCap, roles: ["super_admin", "school_admin", "teacher"] },
  { title: "Staff", href: "/admin/staff", icon: Users, roles: ["super_admin", "school_admin", "hr_staff"] },
  { title: "Attendance", href: "/admin/attendance", icon: ClipboardCheck, roles: ["super_admin", "school_admin", "teacher"] },
  { title: "Grades", href: "/admin/grades", icon: BarChart3, roles: ["super_admin", "school_admin", "teacher"] },
  { title: "Fees", href: "/admin/fees", icon: CreditCard, roles: ["super_admin", "school_admin", "finance_officer", "parent"] },
  { title: "Reports", href: "/admin/reports", icon: FileText, roles: ["super_admin", "school_admin", "teacher", "parent", "student"] },
  { title: "Teacher Classes", href: "/teacher/classes", icon: BookOpen, roles: ["teacher"] },
  { title: "Assignments", href: "/teacher/assignments", icon: FileText, roles: ["teacher", "student"] },
  { title: "AI Tutor", href: "/student/ai-tutor", icon: Sparkles, roles: ["student"] },
  { title: "Children", href: "/parent/children", icon: GraduationCap, roles: ["parent"] },
  { title: "Messages", href: "/parent/messages", icon: MessageSquare, roles: ["parent", "teacher", "school_admin"] },
  { title: "Calendar", href: "/events", icon: CalendarDays, roles: ["super_admin", "school_admin", "teacher", "student", "parent"] },
  { title: "Notifications", href: "/notifications", icon: Bell, roles: ["super_admin", "school_admin", "teacher", "student", "parent"] },
  { title: "Settings", href: "/admin/settings", icon: Settings, roles: ["super_admin", "school_admin", "it_support"] }
];
