"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

type Field = { key: string; label: string };

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function OperationsGenericTable({
  records,
  fields,
  searchFields = []
}: {
  records: Array<Record<string, unknown>>;
  fields: Field[];
  searchFields?: string[];
}) {
  const [query, setQuery] = useState("");
  const searchable = searchFields.length ? searchFields : fields.map((field) => field.key);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) => searchable.some((key) => displayValue(record[key]).toLowerCase().includes(needle)));
  }, [query, records, searchable]);

  return (
    <div className="space-y-4">
      <label className="portal-field flex max-w-2xl items-center gap-2 rounded-lg px-3 py-2">
        <Search className="size-4 shrink-0 text-[#174ea6] dark:text-blue-200" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search this register..."
          className="h-8 min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--portal-text)] outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
        />
      </label>
      <div className="portal-table-wrap max-h-[34rem] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="portal-table-head sticky top-0 z-10 text-xs uppercase">
            <tr>{fields.map((field) => <th key={field.key} className="px-4 py-3 font-black">{field.label}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((record, index) => (
              <tr key={String(record.id ?? index)} className="portal-table-row">
                {fields.map((field) => (
                  <td key={field.key} className="max-w-72 truncate px-4 py-3 font-bold text-[var(--portal-text)]">
                    {displayValue(record[field.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <div className="grid min-h-32 place-items-center text-center text-sm font-black text-[var(--portal-muted)]">
            No matching records.
          </div>
        ) : null}
      </div>
    </div>
  );
}
