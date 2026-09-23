import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffClockForm } from "@/components/forms/StaffClockForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getStaffClockBoard } from "@/features/staff/clock-queries";

export default async function StaffClockPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const board = await getStaffClockBoard(date);
  return (
    <PageWrapper
      title="Staff Clock"
      description="Clock in and out using a staff QR ID card or the CIS/STA fallback ID."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Staff in scope", board.total],
          ["Clocked in", board.clockedIn],
          ["Clocked out", board.completed],
          ["Awaiting clock-in", board.pending],
        ].map(([label, value]) => (
          <Card key={String(label)} className="portal-metric-card">
            <CardContent className="p-5">
              <p className="text-sm font-black text-[var(--portal-muted)]">
                {label}
              </p>
              <p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Daily staff attendance</CardTitle>
            <p className="text-sm font-bold text-[var(--portal-muted)]">
              Use the camera to scan the card. If the camera is unavailable,
              type the staff ID shown on the card.{" "}
              {board.canEditHistory
                ? "You may select a past date to correct its register."
                : "Past registers are closed after the school day."}
            </p>
          </CardHeader>
          <CardContent>
            <StaffClockForm
              attendanceDate={board.date}
              canEditHistory={board.canEditHistory}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{board.scopeLabel}</CardTitle>
            <p className="text-sm font-bold text-[var(--portal-muted)]">
              {new Intl.DateTimeFormat("en-GH", { dateStyle: "full" }).format(
                new Date(`${board.date}T12:00:00`),
              )}
            </p>
          </CardHeader>
          <CardContent>
            <div className="portal-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Staff ID</th>
                    <th>Clock in</th>
                    <th>Clock out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {board.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <p className="font-black">{row.staff}</p>
                        <p className="text-xs font-bold text-[var(--portal-muted)]">
                          {row.jobTitle}
                        </p>
                      </td>
                      <td className="font-black">{row.staffNumber}</td>
                      <td>{row.clockIn}</td>
                      <td>{row.clockOut}</td>
                      <td className="font-black">{row.status}</td>
                    </tr>
                  ))}
                  {!board.rows.length ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center font-bold text-[var(--portal-muted)]"
                      >
                        No staff profile is linked to this account yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
