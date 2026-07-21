"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, QrCode, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BarcodeResult = { rawValue: string };
type BarcodeDetectorInstance = { detect(source: CanvasImageSource): Promise<BarcodeResult[]> };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;
type WindowWithBarcodeDetector = Window & { BarcodeDetector?: BarcodeDetectorConstructor };

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
      setMessage("Camera QR scanning is not supported in this browser. Type the student ID instead.");
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
            onValue(firstCode);
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
      {message ? <p className="text-sm font-bold text-[var(--portal-muted)]">{message}</p> : null}
    </div>
  );
}
