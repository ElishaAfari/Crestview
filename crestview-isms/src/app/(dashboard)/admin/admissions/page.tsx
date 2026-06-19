import { AdmissionDecisionControls, BulkAdmissionDecisionControls } from "@/components/forms/AdmissionDecisionControls";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdmissionApplicationsForAdmin } from "@/features/admin/queries";

export default async function AdminAdmissionsPage() {
  const applications = await listAdmissionApplicationsForAdmin();
  const waiting = applications.filter((application) => application.status === "submitted" || application.status === "reviewing").length;

  return (
    <PageWrapper title="Admissions Review" description="Website applications appear here immediately for head and school administrators to review, accept, or deny.">
      <Card>
        <CardHeader>
          <CardTitle>{waiting} waiting application{waiting === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length ? (
            <div className="portal-table-wrap">
              <table className="w-full text-left text-sm">
                <thead className="portal-table-head text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Guardian</th>
                    <th className="px-4 py-3">Health & documents</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id} className="portal-table-row">
                      <td className="px-4 py-3">
                        <p className="font-black text-[var(--portal-text)]">{application.applicant}</p>
                        <p className="text-xs text-[var(--portal-muted)]">{application.source}</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--portal-muted)]">DOB: {application.dateOfBirth} | {application.gender}</p>
                        <p className="mt-1 max-w-72 text-xs font-semibold text-[var(--portal-muted)]">{application.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[var(--portal-text)]">{application.applyingGrade}</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--portal-muted)]">Previous: {application.previousSchool}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[var(--portal-text)]">{application.guardian}</p>
                        <p className="text-xs text-[var(--portal-muted)]">{application.phone}</p>
                        <div className="mt-2 grid gap-1">
                          {application.guardians.slice(0, 3).map((guardian) => (
                            <p key={`${guardian.name}-${guardian.relationship}`} className="text-xs font-semibold text-[var(--portal-muted)]">
                              {guardian.primary ? "Primary: " : ""}{guardian.name} ({guardian.relationship}) | {guardian.phone}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="max-w-80 px-4 py-3">
                        <p className="text-xs font-semibold text-[var(--portal-muted)]">{application.emergencyContact}</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--portal-muted)]">{application.healthSummary}</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--portal-muted)]">{application.documents}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--portal-muted)]">{application.submittedAt}</td>
                      <td className="px-4 py-3"><StatusBadge status={application.status} /></td>
                      <td className="max-w-72 px-4 py-3 text-[var(--portal-muted)]">{application.notes || "No notes"}</td>
                      <td className="px-4 py-3">
                        {application.status === "submitted" || application.status === "reviewing" ? (
                          <AdmissionDecisionControls applicationId={application.id} />
                        ) : (
                          <span className="text-xs font-semibold text-[var(--portal-muted)]">Decision recorded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No student applications yet" message="Fresh website applications will appear here as soon as families apply." />
          )}
        </CardContent>
      </Card>
      <BulkAdmissionDecisionControls />
    </PageWrapper>
  );
}
