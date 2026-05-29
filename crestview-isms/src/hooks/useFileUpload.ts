"use client";

import { useState } from "react";
import { FILE_LIMITS } from "@/lib/constants";

export function useFileUpload() {
  const [error, setError] = useState<string | null>(null);

  function validateFile(file: File) {
    setError(null);
    const allowedTypes: readonly string[] = [...FILE_LIMITS.imageTypes, ...FILE_LIMITS.documentTypes];
    const isImage = FILE_LIMITS.imageTypes.includes(file.type as (typeof FILE_LIMITS.imageTypes)[number]);
    const maxSize = isImage ? FILE_LIMITS.imageBytes : FILE_LIMITS.documentBytes;

    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file type.");
      return false;
    }

    if (file.size > maxSize) {
      setError("File is larger than the allowed limit.");
      return false;
    }

    return true;
  }

  return { error, validateFile };
}
