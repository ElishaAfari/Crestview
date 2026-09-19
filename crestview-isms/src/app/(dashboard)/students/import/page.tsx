import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { StudentCsvImportForm } from "@/components/forms/StudentCsvImportForm";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function StudentImportPage() {
  return <PageWrapper title="Import students" description="Enroll an existing school register in one controlled, auditable batch.">
    <div className="mb-5 flex items-center justify-between gap-3"><Link href="/students" className="portal-register-link px-4 py-2 text-sm"><ArrowLeft size={16} aria-hidden />Student directory</Link><span className="portal-icon-tile portal-tone-blue size-10 rounded-lg p-2"><Upload size={20} aria-hidden /></span></div>
    <section className="portal-card grid gap-5 p-6">
      <div><h2 className="text-xl font-black">Bulk student intake</h2><p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">Existing student records are enrolled without requiring one-by-one forms. Duplicate student IDs are skipped safely.</p></div>
      <StudentCsvImportForm />
    </section>
  </PageWrapper>;
}
