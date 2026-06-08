"use client";

import { Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";

export function FileUploader({ onValidFile }: { onValidFile?: (file: File) => void }) {
  const { error, validateFile } = useFileUpload();

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-6 text-center transition hover:bg-blue-50/70 dark:hover:bg-blue-500/10">
      <Upload className="mb-2 size-6 text-blue-600 dark:text-blue-300" aria-hidden />
      <span className="text-sm font-bold text-[var(--portal-text)]">Upload file</span>
      <span className="mt-1 text-xs text-[var(--portal-muted)]">PDF, DOCX, PNG, JPG, or WEBP</span>
      <input
        className="sr-only"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file && validateFile(file)) {
            onValidFile?.(file);
          }
        }}
      />
      {error ? <span className="mt-2 text-xs text-red-600 dark:text-red-300">{error}</span> : null}
    </label>
  );
}
