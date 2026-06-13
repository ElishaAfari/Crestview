import { StatusBadge } from "@/components/shared/StatusBadge";
import type { AttendanceRegisterRow } from "@/features/dashboard/queries";

export function AttendanceRegisterTable({ data = [] }: { data?: AttendanceRegisterRow[] }) {
  if (!data.length) {
    return <p className="text-sm font-bold text-[var(--portal-muted)]">No submitted attendance registers yet.</p>;
  }

  return (
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
          {data.map((register) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
