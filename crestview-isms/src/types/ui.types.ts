import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
};

export type StatCard = {
  label: string;
  value: string;
  change: string;
  tone: "blue" | "green" | "amber" | "red";
};
