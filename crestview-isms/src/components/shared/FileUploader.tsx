"use client";

import { Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";

export function FileUploader({ onValidFile }: { onValidFile?: (file: File) => void }) {
  const { error, validateFile } = useFileUpload();

  return (
    <label className="portal-subtle-card flex cursor-pointer flex-col items-center justify-center rounded-lg border-dashed p-6 text-center transition hover:border-blue-700 dark:hover:bg-blue-500/10">
      <Upload className="portal-icon-tile portal-tone-blue mb-2 size-10 rounded-lg p-2.5" aria-hidden />
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
