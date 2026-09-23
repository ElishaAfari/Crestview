import { describe, expect, it } from "vitest";
import { normalizeQrCapture } from "../../lib/qr/normalize";

describe("normalizeQrCapture", () => {
  it("normalizes the student card QR payload variants", () => {
    expect(normalizeQrCapture("CIS/ST/000167", "student")).toBe(
      "CIS/ST/000167",
    );
    expect(normalizeQrCapture("stu000167", "student")).toBe("CIS/ST/000167");
    expect(
      normalizeQrCapture(
        "https://portal.example/card?student=CIS%2FST%2F000167",
        "student",
      ),
    ).toBe("CIS/ST/000167");
  });

  it("normalizes the staff card QR payload variants", () => {
    expect(normalizeQrCapture("CIS/STA0001", "staff")).toBe("CIS/STA0001");
    expect(normalizeQrCapture("STA-1", "staff")).toBe("CIS/STA0001");
  });
});
