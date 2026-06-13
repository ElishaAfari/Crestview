import { BulkRecruitmentDecisionControls, RecruitmentDecisionControls } from "@/components/forms/RecruitmentDecisionControls";
import { JobPostingForm } from "@/components/forms/JobPostingForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminFormOptions, listJobApplicationsForAdmin } from "@/features/admin/queries";

export default async function AdminRecruitmentPage() {
  const [applications, options] = await Promise.all([listJobApplicationsForAdmin(), listAdminFormOptions()]);
  const waiting = applications.filter((application) => application.status === "submitted").length;

  return (
    <PageWrapper title="Recruitment Review" description="Teacher and staff applications from the website can be accepted into role-specific workspaces or denied after review.">
      <Card>
        <CardHeader>
          <CardTitle>Open a Website Vacancy</CardTitle>
        </CardHeader>
        <CardContent>
          <JobPostingForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{waiting} waiting candidate{waiting === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length ? (
            <div className="portal-table-wrap">
              <table className="w-full text-left text-sm">
                <thead className="portal-table-head text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Profile</th>
                    <th className="px-4 py-3">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id} className="portal-table-row">
                      <td className="px-4 py-3">
                        <p className="font-black text-[var(--portal-text)]">{application.applicant}</p>
                        <p className="text-xs text-[var(--portal-muted)]">{application.email}</p>
                        <p className="text-xs text-[var(--portal-muted)]">{application.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[var(--portal-text)]">{application.role}</p>
                        <p className="text-xs capitalize text-[var(--portal-muted)]">{application.employmentType}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--portal-muted)]">{application.submittedAt}</td>
                      <td className="px-4 py-3"><StatusBadge status={application.status} /></td>
                      <td className="max-w-xl px-4 py-3 text-[var(--portal-muted)]">{application.coverLetter || "No profile note"}</td>
                      <td className="px-4 py-3">
                        {application.status === "submitted" ? (
                          <RecruitmentDecisionControls applicationId={application.id} classrooms={options.classrooms} />
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
            <EmptyState title="No recruitment applications yet" message="Teacher and staff applicants will appear here after applying from the website." />
          )}
        </CardContent>
      </Card>
      <BulkRecruitmentDecisionControls />
    </PageWrapper>
  );
}
