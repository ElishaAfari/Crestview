"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Keyboard, QrCode, StopCircle } from "lucide-react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function normalizeQrCapture(value: string, entity: "student" | "staff") {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    const fromQuery = parsed.searchParams.get("student") ?? parsed.searchParams.get("studentNumber") ?? parsed.searchParams.get("id");
    if (fromQuery) return normalizeQrCapture(fromQuery, entity);
  } catch {
    // Plain QR payloads are expected; URLs are only an optional convenience.
  }
  const withoutPrefix = trimmed.replace(entity === "staff" ? /^(?:CIS-STAFF|CRESTVIEW-STAFF|STA)[:\s-]+/i : /^(?:CIS-STUDENT|CRESTVIEW-STUDENT|STU)[:\s-]+/i, "");
  if (entity === "staff") {
    const staffMatch = withoutPrefix.match(/^cis\s*[\/-]?\s*sta\s*[\/-]?\s*(\d{1,4})$/i);
    return staffMatch ? `CIS/STA${staffMatch[1].padStart(4, "0")}` : withoutPrefix.trim();
  }
  const match = withoutPrefix.match(/^(?:CIS\s*[\/-]?\s*ST\s*[\/-]?\s*|STU\s*-?\s*)(\d{6})$/i);
  return match ? `CIS/ST/${match[1]}` : withoutPrefix.trim();
}

export function StudentQrCapture({
  value,
  onValue,
  name = "studentLookup",
  label = "Student ID or QR code",
  placeholder = "Scan QR or type CIS/ST/000001",
  entity = "student",
  onScanned,
}: {
  value: string;
  onValue: (value: string) => void;
  name?: string;
  label?: string;
  placeholder?: string;
  entity?: "student" | "staff";
  onScanned?: () => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const activeRef = useRef(false);

  const stopScan = useCallback(() => {
    activeRef.current = false;
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => stopScan, [stopScan]);

  async function startScan() {
    try {
      if (!window.isSecureContext) {
        setMessage("Camera access requires HTTPS. Open the secure school portal URL, then try Scan QR again.");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage("Chrome cannot access a camera in this browser context. Check the site address and camera permissions, then try again.");
        return;
      }
      setMessage("Requesting camera permission...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } }
      });
      streamRef.current = stream;
      activeRef.current = true;
      setScanning(true);
      setMessage("Point the camera at the student ID card QR code.");
      const video = videoRef.current;
      if (!video) {
        stopScan();
        setMessage("The camera preview could not be initialized. Type the student ID instead.");
        return;
      }
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 120,
        delayBetweenScanSuccess: 500
      });
      controlsRef.current = await reader.decodeFromStream(stream, video, (result) => {
        const text = result?.getText();
        if (!text || !activeRef.current) return;
        onValue(normalizeQrCapture(text, entity));
        onScanned?.();
        setMessage("QR code captured.");
        stopScan();
      });
    } catch (error) {
      stopScan();
      const name = error instanceof DOMException ? error.name : "";
      setMessage(
        name === "NotAllowedError"
          ? "Camera permission was blocked. Select the camera icon in Chrome's address bar, allow access for this site, then try Scan QR again."
          : name === "NotFoundError"
            ? "No camera was found on this device. Connect a camera or enter the student ID manually."
            : "Chrome could not open the camera. Check site permissions and HTTPS, then try Scan QR again."
      );
    }
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <QrCode className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-700 dark:text-blue-200" aria-hidden />
          <Input
            name={name}
            value={value}
            onChange={(event) => onValue(event.target.value)}
            onBlur={(event) => onValue(normalizeQrCapture(event.target.value, entity))}
            placeholder={placeholder}
            className="pl-9"
            autoComplete="off"
          />
        </div>
        {scanning ? (
          <Button type="button" variant="secondary" onClick={stopScan}>
            <StopCircle className="size-4" aria-hidden />
            Stop scan
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={startScan}>
            <Camera className="size-4" aria-hidden />
            Scan QR
          </Button>
        )}
      </div>
      <video
        ref={videoRef}
        muted
        playsInline
        aria-label={`${entity === "staff" ? "Staff" : "Student"} ID QR scanner camera preview`}
        className={scanning ? "aspect-video w-full rounded-lg border border-[var(--portal-border)] bg-black object-cover" : "hidden"}
      />
      <div className="portal-subtle-card flex items-start gap-2 rounded-lg p-3 text-xs font-extrabold text-[var(--portal-muted)]">
        <Keyboard className="mt-0.5 size-4 shrink-0 text-blue-700 dark:text-blue-200" aria-hidden />
        <span>Manual fallback accepts the {entity === "staff" ? "staff member's CIS/STA0001 ID" : "student's CIS/ST/000001 ID"}, the QR payload, or a copied QR URL containing the ID.</span>
      </div>
      {message ? <p className="text-sm font-bold text-[var(--portal-muted)]">{message}</p> : null}
    </div>
  );
}
