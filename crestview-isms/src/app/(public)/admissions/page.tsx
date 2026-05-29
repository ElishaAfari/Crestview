import { AdmissionForm } from "@/components/forms/AdmissionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdmissionsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl font-semibold text-white">Admissions</h1>
      <p className="mt-3 max-w-2xl text-slate-400">Start an application for the 2026 intake. The admissions team will review and follow up.</p>
      <Card className="mt-8">
        <CardHeader><CardTitle>Application Details</CardTitle></CardHeader>
        <CardContent><AdmissionForm /></CardContent>
      </Card>
    </main>
  );
}
