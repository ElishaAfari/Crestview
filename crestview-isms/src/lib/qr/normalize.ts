export type QrEntity = "student" | "staff";

export function normalizeQrCapture(value: string, entity: QrEntity) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    const fromQuery =
      parsed.searchParams.get("student") ??
      parsed.searchParams.get("studentNumber") ??
      parsed.searchParams.get("id");
    if (fromQuery) return normalizeQrCapture(fromQuery, entity);
  } catch {
    // Plain QR payloads are expected; URLs are only an optional convenience.
  }

  if (entity === "staff") {
    const staffMatch = trimmed.match(
      /^(?:cis\s*[\/-]?\s*)?sta\s*[\/-]?\s*(\d{1,4})$/i,
    );
    return staffMatch ? `CIS/STA${staffMatch[1].padStart(4, "0")}` : trimmed;
  }

  const withoutPrefix = trimmed.replace(
    /^(?:CIS-STUDENT|CRESTVIEW-STUDENT|STU)[:\s-]+/i,
    "",
  );

  const match = withoutPrefix.match(
    /^(?:CIS\s*[\/-]?\s*ST\s*[\/-]?\s*|STU\s*-?\s*)(\d{6})$/i,
  );
  return match ? `CIS/ST/${match[1]}` : withoutPrefix.trim();
}
