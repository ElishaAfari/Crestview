"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Keyboard, QrCode, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BarcodeResult = { rawValue: string };
type BarcodeDetectorInstance = { detect(source: CanvasImageSource): Promise<BarcodeResult[]> };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;
type WindowWithBarcodeDetector = Window & { BarcodeDetector?: BarcodeDetectorConstructor };

function normalizeQrCapture(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    const fromQuery = parsed.searchParams.get("student") ?? parsed.searchParams.get("studentNumber") ?? parsed.searchParams.get("id");
    if (fromQuery) return normalizeQrCapture(fromQuery);
  } catch {
    // Plain QR payloads are expected; URLs are only an optional convenience.
  }
  const withoutPrefix = trimmed.replace(/^CIS-STUDENT[:\s-]*/i, "");
  const compact = withoutPrefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return compact || trimmed.toUpperCase();
}

export function StudentQrCapture({
  value,
  onValue,
  name = "studentLookup",
  label = "Student ID or QR code",
  placeholder = "Scan QR or type 8-digit student ID"
}: {
  value: string;
  onValue: (value: string) => void;
  name?: string;
  label?: string;
  placeholder?: string;
}) {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const stopScan = useCallback(() => {
    activeRef.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => stopScan, [stopScan]);

  async function startScan() {
    const BarcodeDetector = (window as WindowWithBarcodeDetector).BarcodeDetector;
    if (!BarcodeDetector) {
      setMessage("Camera QR scanning is not supported in this browser. Use Chrome/Edge with camera permission, or type/paste the 8-digit student ID.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Camera access is not available. Type the student ID instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      activeRef.current = true;
      setScanning(true);
      setMessage("Point the camera at the student ID card QR code.");
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const detector = new BarcodeDetector({ formats: ["qr_code"] });

      const scanFrame = async () => {
        if (!activeRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const firstCode = codes[0]?.rawValue;
          if (firstCode) {
            onValue(normalizeQrCapture(firstCode));
            setMessage("QR code captured.");
            stopScan();
            return;
          }
        } catch {
          setMessage("Still looking for a readable QR code.");
        }
        frameRef.current = requestAnimationFrame(scanFrame);
      };

      frameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      stopScan();
      setMessage("Camera permission was not granted. Type the student ID instead.");
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
            onBlur={(event) => onValue(normalizeQrCapture(event.target.value))}
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
      <video ref={videoRef} muted playsInline className={scanning ? "aspect-video w-full rounded-lg border border-[var(--portal-border)] bg-black object-cover" : "hidden"} />
      <div className="portal-subtle-card flex items-start gap-2 rounded-lg p-3 text-xs font-extrabold text-[var(--portal-muted)]">
        <Keyboard className="mt-0.5 size-4 shrink-0 text-blue-700 dark:text-blue-200" aria-hidden />
        <span>Manual fallback accepts the student&apos;s 8-digit ID, the QR payload, or a copied QR URL containing the student ID.</span>
      </div>
      {message ? <p className="text-sm font-bold text-[var(--portal-muted)]">{message}</p> : null}
    </div>
  );
}
