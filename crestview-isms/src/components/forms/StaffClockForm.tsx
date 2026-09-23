"use client";

import { useRef, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { StudentQrCapture } from "@/components/forms/StudentQrCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clockStaffAttendanceAction } from "@/features/staff/clock-actions";

export function StaffClockForm() {
  const [staffLookup, setStaffLookup] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [source, setSource] = useState<"qr" | "manual">("manual");
  const [message, setMessage] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const date = new Date().toISOString().slice(0, 10);

  async function saveClock(lookup: string, captureSource: "qr" | "manual") {
    if (!lookup || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    const form = new FormData();
    form.set("staffLookup", lookup);
    form.set("attendanceDate", date);
    form.set("direction", direction);
    form.set("source", captureSource);
    const result = await clockStaffAttendanceAction(form);
    setMessage(result);
    if (result.ok) setStaffLookup("");
    setPending(false);
    pendingRef.current = false;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveClock(staffLookup, source);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Date</Label>
          <Input name="attendanceDate" type="date" value={date} readOnly />
        </div>
        <div>
          <Label>Action</Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={direction === "in" ? "default" : "secondary"}
              onClick={() => setDirection("in")}
            >
              <LogIn className="size-4" aria-hidden />
              Clock in
            </Button>
            <Button
              type="button"
              variant={direction === "out" ? "default" : "secondary"}
              onClick={() => setDirection("out")}
            >
              <LogOut className="size-4" aria-hidden />
              Clock out
            </Button>
          </div>
        </div>
      </div>
      <StudentQrCapture
        value={staffLookup}
        onValue={(value) => {
          setStaffLookup(value);
          setSource("manual");
        }}
        onScanned={(capturedValue) => {
          setSource("qr");
          void saveClock(capturedValue, "qr");
        }}
        name="staffLookup"
        label="Staff ID card QR"
        placeholder="Scan QR or type CIS/STA0001"
        entity="staff"
      />
      <Button type="submit" disabled={pending || !staffLookup}>
        {pending
          ? "Saving clock..."
          : direction === "in"
            ? "Confirm clock in"
            : "Confirm clock out"}
      </Button>
      {message ? (
        <p
          className={`text-sm font-black ${message.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}
        >
          {message.message}
        </p>
      ) : null}
    </form>
  );
}
