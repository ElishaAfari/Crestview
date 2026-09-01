"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import type { AttendanceRegisterRow } from "@/features/dashboard/queries";

export function AttendanceRegisterTable({ data = [] }: { data?: AttendanceRegisterRow[] }) {
  const [query, setQuery] = useState("");
  const filteredData = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((register) => [
      register.classroom,
      register.date,
      register.status,
      register.submittedBy,
      register.submittedAt
    ].join(" ").toLowerCase().includes(needle));
  }, [data, query]);

  if (!data.length) {
    return <p className="text-sm font-bold text-[var(--portal-muted)]">No submitted attendance registers yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-700 dark:text-blue-200" aria-hidden />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search registers by class, date, status..." className="pl-9" type="search" />
      </div>
      <div className="portal-table-wrap">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="portal-table-head text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted by</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Present</th>
              <th className="px-4 py-3 text-right">Late</th>
              <th className="px-4 py-3 text-right">Absent</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length ? filteredData.map((register) => (
              <tr key={register.id} className="portal-table-row">
                <td className="px-4 py-3 font-black text-[var(--portal-text)]">{register.classroom}</td>
                <td className="px-4 py-3 font-semibold text-[var(--portal-text)]">{register.date}</td>
                <td className="px-4 py-3"><StatusBadge status={register.status} /></td>
                <td className="px-4 py-3 font-semibold text-[var(--portal-text)]">{register.submittedBy}</td>
                <td className="px-4 py-3 font-semibold text-[var(--portal-muted)]">{register.submittedAt}</td>
                <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-300">{register.present}</td>
                <td className="px-4 py-3 text-right font-black text-amber-700 dark:text-amber-300">{register.late}</td>
                <td className="px-4 py-3 text-right font-black text-red-700 dark:text-red-300">{register.absent}</td>
                <td className="px-4 py-3 text-right font-black text-[var(--portal-text)]">{register.total}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center font-bold text-[var(--portal-muted)]">No registers match that search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
