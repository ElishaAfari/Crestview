"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function CsvDownloadLink({
  rows,
  filename,
  label
}: {
  rows: Array<Record<string, unknown>>;
  filename: string;
  label: string;
}) {
  const href = useMemo(() => {
    const keys = Array.from(rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()));
    const csv = [keys, ...rows.map((row) => keys.map((key) => row[key]))]
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\n");
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, [rows]);

  return (
    <a className="portal-register-link h-10 px-4 text-sm" download={filename} href={href}>
      <Download className="size-4" aria-hidden />{label}
    </a>
  );
}
