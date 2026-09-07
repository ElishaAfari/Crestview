export type SuiteNavigationTone = {
  sectionIcon: string;
  itemIcon: string;
};

const blue =
  "bg-[#2563eb] text-white ring-white/20 shadow-[0_14px_28px_-16px_rgba(37,99,235,0.9)]";
const green =
  "bg-[#059669] text-white ring-white/20 shadow-[0_14px_28px_-16px_rgba(5,150,105,0.9)]";
const orange =
  "bg-[#d97706] text-white ring-white/20 shadow-[0_14px_28px_-16px_rgba(217,119,6,0.9)]";
const red =
  "bg-[#dc244f] text-white ring-white/20 shadow-[0_14px_28px_-16px_rgba(220,36,79,0.9)]";
const brown =
  "bg-[#8b4a19] text-white ring-white/20 shadow-[0_14px_28px_-16px_rgba(139,74,25,0.9)]";
const teal =
  "bg-[#0f766e] text-white ring-white/20 shadow-[0_14px_28px_-16px_rgba(15,118,110,0.9)]";

const toneBySuite: Record<string, SuiteNavigationTone> = {
  Overview: { sectionIcon: blue, itemIcon: blue },
  People: { sectionIcon: green, itemIcon: green },
  Academics: { sectionIcon: orange, itemIcon: orange },
  Admissions: { sectionIcon: red, itemIcon: red },
  Preschool: { sectionIcon: green, itemIcon: green },
  Finance: { sectionIcon: orange, itemIcon: orange },
  "HR & Payroll": { sectionIcon: brown, itemIcon: brown },
  Facilities: { sectionIcon: brown, itemIcon: brown },
  Communication: { sectionIcon: teal, itemIcon: teal },
  Reports: { sectionIcon: blue, itemIcon: blue },
  Settings: { sectionIcon: brown, itemIcon: brown },
  Teaching: { sectionIcon: orange, itemIcon: orange },
  Support: { sectionIcon: teal, itemIcon: teal },
  Learning: { sectionIcon: orange, itemIcon: orange },
  Family: { sectionIcon: green, itemIcon: green },
  Operations: { sectionIcon: brown, itemIcon: brown },
  Library: { sectionIcon: teal, itemIcon: teal },
  Technology: { sectionIcon: blue, itemIcon: blue },
};

export function getSuiteNavigationTone(title: string): SuiteNavigationTone {
  return toneBySuite[title] ?? { sectionIcon: blue, itemIcon: blue };
}
