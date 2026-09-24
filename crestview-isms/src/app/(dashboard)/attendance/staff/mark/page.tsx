import { redirect } from "next/navigation";

/** Keep the reference-style staff attendance URL pointed at the live clock register. */
export default function StaffAttendanceMarkRedirect() {
  redirect("/staff-clock");
}
