"use client";

import type * as React from "react";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  id: string;
  label: string;
  meta?: string;
};

export function SearchableSelect({
  label,
  options = [],
  placeholder = "Choose option",
  searchPlaceholder = "Search...",
  emptyLabel = "No matching options",
  helper,
  className,
  ...selectProps
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options?: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  helper?: React.ReactNode;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => `${option.label} ${option.meta ?? ""}`.toLowerCase().includes(needle));
  }, [options, query]);
  const selectedValue = selectProps.value ?? selectProps.defaultValue;
  const selectedOption = selectedValue ? options.find((option) => option.id === selectedValue) : null;
  const visibleOptions = selectedOption && !filteredOptions.some((option) => option.id === selectedOption.id)
    ? [selectedOption, ...filteredOptions]
    : filteredOptions;

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label>{label}</Label> : null}
      <label className="portal-field flex items-center gap-2 rounded-lg px-3 py-2">
        <Search className="size-4 shrink-0 text-blue-700 dark:text-blue-200" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--portal-text)] outline-none placeholder:text-slate-500"
          type="search"
        />
      </label>
      <Select {...selectProps}>
        <option value="">{placeholder}</option>
        {visibleOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </Select>
      {query && !filteredOptions.length ? <p className="text-xs font-black text-red-700 dark:text-red-300">{emptyLabel}</p> : null}
      {helper ? <div className="text-xs font-extrabold text-[var(--portal-muted)]">{helper}</div> : null}
    </div>
  );
}
