"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitAdmissionAction } from "@/features/admissions/actions";

type AdmissionFormValues = {
  applicantFirstName: string;
  applicantMiddleName?: string;
  applicantLastName: string;
  applicantDateOfBirth: string;
  applyingGrade: string;
  applicantGender: string;
  homeAddress: string;
  city: string;
  zipCode?: string;
  previousSchool?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherAddress?: string;
  fatherOccupation?: string;
  fatherLocation?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherAddress?: string;
  motherOccupation?: string;
  motherLocation?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress?: string;
  guardianRelationship: string;
  guardianRelationshipOther?: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  primaryPhysicianName?: string;
  primaryPhysicianPhone?: string;
  healthInsuranceNumber?: string;
  hasAllergies: "yes" | "no";
  allergiesDetails?: string;
  hasMedicalConditions: "yes" | "no";
  medicalConditionsDetails?: string;
  submittedBirthCertificate?: boolean;
  submittedProofOfAddress?: boolean;
  submittedNhis?: boolean;
  certifyAccuracy: boolean;
  consentEmergencyTreatment: boolean;
  acknowledgeNoGuarantee: boolean;
  notes?: string;
};

const grades = [
  "Nursery 1",
  "Nursery 2",
  "KG 1",
  "KG 2",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "Junior High 1",
  "Junior High 2",
  "Junior High 3"
];

const relationships = ["Father", "Mother", "Guardian", "Grandparent", "Aunt/Uncle", "Other"];
const inputClass = "mt-1 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-[#082b91] focus:ring-[#082b91]";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="font-heading text-lg font-black text-[#06165b]">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function TextField({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm font-black text-slate-800">
        {label}{required ? <span className="text-[#cf1017]"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

function CheckField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold leading-5 text-slate-800">
      {children}
      <span>{label}</span>
    </label>
  );
}

export function AdmissionForm() {
  const form = useForm<AdmissionFormValues>({
    defaultValues: {
      hasAllergies: "no",
      hasMedicalConditions: "no",
      applicantGender: "",
      applyingGrade: "",
      guardianRelationship: "",
      certifyAccuracy: false,
      consentEmergencyTreatment: false,
      acknowledgeNoGuarantee: false
    }
  });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: AdmissionFormValues) {
    setMessage(null);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.set(key, typeof value === "boolean" ? String(value) : value ?? "");
    });
    const result = await submitAdmissionAction(formData);
    setMessage(result.message);
    setSubmitted(result.ok);
    if (result.ok) form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      <Section title="Learner Information">
        <TextField label="First name" required><Input required className={inputClass} {...form.register("applicantFirstName")} /></TextField>
        <TextField label="Middle name"><Input className={inputClass} {...form.register("applicantMiddleName")} /></TextField>
        <TextField label="Last name" required><Input required className={inputClass} {...form.register("applicantLastName")} /></TextField>
        <TextField label="Date of birth" required><Input required type="date" className={inputClass} {...form.register("applicantDateOfBirth")} /></TextField>
        <TextField label="Applying class" required>
          <Select required className={inputClass} {...form.register("applyingGrade")}>
            <option value="">Select class</option>
            {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
          </Select>
        </TextField>
        <TextField label="Gender" required>
          <Select required className={inputClass} {...form.register("applicantGender")}>
            <option value="">Select gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </Select>
        </TextField>
        <TextField label="Home address" required><Input required className={inputClass} {...form.register("homeAddress")} /></TextField>
        <TextField label="City / town" required><Input required className={inputClass} {...form.register("city")} /></TextField>
        <TextField label="Zip code"><Input className={inputClass} {...form.register("zipCode")} /></TextField>
        <TextField label="Previous school"><Input className={inputClass} {...form.register("previousSchool")} /></TextField>
      </Section>

      <Section title="Parent And Guardian Details">
        <TextField label="Father's name"><Input className={inputClass} {...form.register("fatherName")} /></TextField>
        <TextField label="Father phone"><Input type="tel" className={inputClass} {...form.register("fatherPhone")} /></TextField>
        <TextField label="Father email"><Input type="email" className={inputClass} {...form.register("fatherEmail")} /></TextField>
        <TextField label="Father occupation"><Input className={inputClass} {...form.register("fatherOccupation")} /></TextField>
        <TextField label="Father location"><Input className={inputClass} {...form.register("fatherLocation")} /></TextField>
        <TextField label="Father address if different"><Input className={inputClass} {...form.register("fatherAddress")} /></TextField>
        <TextField label="Mother's name"><Input className={inputClass} {...form.register("motherName")} /></TextField>
        <TextField label="Mother phone"><Input type="tel" className={inputClass} {...form.register("motherPhone")} /></TextField>
        <TextField label="Mother email"><Input type="email" className={inputClass} {...form.register("motherEmail")} /></TextField>
        <TextField label="Mother occupation"><Input className={inputClass} {...form.register("motherOccupation")} /></TextField>
        <TextField label="Mother location"><Input className={inputClass} {...form.register("motherLocation")} /></TextField>
        <TextField label="Mother address if different"><Input className={inputClass} {...form.register("motherAddress")} /></TextField>
        <TextField label="Primary guardian name" required><Input required className={inputClass} {...form.register("guardianName")} /></TextField>
        <TextField label="Primary guardian phone" required><Input required type="tel" className={inputClass} {...form.register("guardianPhone")} /></TextField>
        <TextField label="Primary guardian email" required><Input required type="email" className={inputClass} {...form.register("guardianEmail")} /></TextField>
        <TextField label="Relationship" required>
          <Select required className={inputClass} {...form.register("guardianRelationship")}>
            <option value="">Select relationship</option>
            {relationships.map((relationship) => <option key={relationship} value={relationship}>{relationship}</option>)}
          </Select>
        </TextField>
        <TextField label="Other relationship"><Input className={inputClass} {...form.register("guardianRelationshipOther")} /></TextField>
        <TextField label="Guardian address if different"><Input className={inputClass} {...form.register("guardianAddress")} /></TextField>
      </Section>

      <Section title="Health And Emergency Information">
        <TextField label="Emergency contact name" required><Input required className={inputClass} {...form.register("emergencyContactName")} /></TextField>
        <TextField label="Emergency contact relationship" required><Input required className={inputClass} {...form.register("emergencyContactRelationship")} /></TextField>
        <TextField label="Emergency contact phone" required><Input required type="tel" className={inputClass} {...form.register("emergencyContactPhone")} /></TextField>
        <TextField label="Health insurance number"><Input className={inputClass} {...form.register("healthInsuranceNumber")} /></TextField>
        <TextField label="Primary physician name"><Input className={inputClass} {...form.register("primaryPhysicianName")} /></TextField>
        <TextField label="Primary physician phone"><Input type="tel" className={inputClass} {...form.register("primaryPhysicianPhone")} /></TextField>
        <TextField label="Allergies" required>
          <Select required className={inputClass} {...form.register("hasAllergies")}>
            <option value="no">No known allergies</option>
            <option value="yes">Yes, list below</option>
          </Select>
        </TextField>
        <TextField label="Allergy details"><Input className={inputClass} {...form.register("allergiesDetails")} /></TextField>
        <TextField label="Medical conditions" required>
          <Select required className={inputClass} {...form.register("hasMedicalConditions")}>
            <option value="no">No known medical conditions</option>
            <option value="yes">Yes, list below</option>
          </Select>
        </TextField>
        <TextField label="Medical condition details"><Input className={inputClass} {...form.register("medicalConditionsDetails")} /></TextField>
      </Section>

      <Section title="Documents And Declaration">
        <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
          <CheckField label="Birth certificate submitted"><input type="checkbox" className="mt-0.5 size-4 accent-[#082b91]" {...form.register("submittedBirthCertificate")} /></CheckField>
          <CheckField label="Proof of address submitted"><input type="checkbox" className="mt-0.5 size-4 accent-[#082b91]" {...form.register("submittedProofOfAddress")} /></CheckField>
          <CheckField label="NHIS submitted"><input type="checkbox" className="mt-0.5 size-4 accent-[#082b91]" {...form.register("submittedNhis")} /></CheckField>
        </div>
        <div className="sm:col-span-2 grid gap-3">
          <CheckField label="I certify that the information provided is accurate."><input required type="checkbox" className="mt-0.5 size-4 accent-[#cf1017]" {...form.register("certifyAccuracy")} /></CheckField>
          <CheckField label="I give permission for emergency medical treatment if required."><input required type="checkbox" className="mt-0.5 size-4 accent-[#cf1017]" {...form.register("consentEmergencyTreatment")} /></CheckField>
          <CheckField label="I understand that submitting this form does not guarantee admission."><input required type="checkbox" className="mt-0.5 size-4 accent-[#cf1017]" {...form.register("acknowledgeNoGuarantee")} /></CheckField>
        </div>
        <div className="sm:col-span-2">
          <TextField label="Additional notes"><Textarea placeholder="Tell us anything that will help us support your child." className={`${inputClass} min-h-28`} {...form.register("notes")} /></TextField>
        </div>
      </Section>

      <div className="flex flex-col items-start gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting} className="bg-[#cf1017] px-6 text-white hover:bg-[#ad0d13]">
          {form.formState.isSubmitting ? "Submitting..." : "Submit application"}
        </Button>
        {message ? <p className={`text-sm font-black ${submitted ? "text-emerald-700" : "text-red-700"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
