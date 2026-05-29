"use client";

import { Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";

export function FileUploader({ onValidFile }: { onValidFile?: (file: File) => void }) {
  const { error, validateFile } = useFileUpload();

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-950/40 p-6 text-center transition hover:bg-white/[0.03]">
      <Upload className="mb-2 size-6 text-blue-300" aria-hidden />
      <span className="text-sm font-medium text-slate-100">Upload file</span>
      <span className="mt-1 text-xs text-slate-500">PDF, DOCX, PNG, JPG, or WEBP</span>
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
      {error ? <span className="mt-2 text-xs text-red-300">{error}</span> : null}
    </label>
  );
}
