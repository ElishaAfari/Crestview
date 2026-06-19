import { z } from "zod";

const requiredText = (message: string, max = 160) => z.string().trim().min(2, message).max(max);
const optionalText = (max = 300) => z.string().trim().max(max).optional().transform((value) => value || undefined);
const optionalEmail = z.string().trim().optional().transform((value) => value || undefined).pipe(z.string().email().optional());
const check = z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean());

export const admissionSchema = z.object({
  applicantFirstName: requiredText("Enter the learner's first name."),
  applicantMiddleName: optionalText(80),
  applicantLastName: requiredText("Enter the learner's last name."),
  applicantDateOfBirth: z.string().trim().min(4, "Enter the learner's date of birth."),
  applyingGrade: requiredText("Select the class the learner is applying for."),
  applicantGender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    required_error: "Select the learner's gender."
  }),
  homeAddress: requiredText("Enter the learner's home address.", 300),
  city: requiredText("Enter the city or town.", 120),
  zipCode: optionalText(40),
  previousSchool: optionalText(180),
  fatherName: optionalText(160),
  fatherPhone: optionalText(40),
  fatherEmail: optionalEmail,
  fatherAddress: optionalText(300),
  fatherOccupation: optionalText(120),
  fatherLocation: optionalText(120),
  motherName: optionalText(160),
  motherPhone: optionalText(40),
  motherEmail: optionalEmail,
  motherAddress: optionalText(300),
  motherOccupation: optionalText(120),
  motherLocation: optionalText(120),
  guardianName: requiredText("Enter the primary parent or guardian name.", 160),
  guardianPhone: z.string().trim().min(7, "Enter the primary parent or guardian phone number.").max(40),
  guardianEmail: z.string().trim().email("Enter a valid primary parent or guardian email."),
  guardianAddress: optionalText(300),
  guardianRelationship: requiredText("Enter the guardian's relationship to the learner.", 80),
  guardianRelationshipOther: optionalText(100),
  emergencyContactName: requiredText("Enter an emergency contact name.", 160),
  emergencyContactRelationship: requiredText("Enter the emergency contact relationship.", 100),
  emergencyContactPhone: z.string().trim().min(7, "Enter the emergency contact phone number.").max(40),
  primaryPhysicianName: optionalText(160),
  primaryPhysicianPhone: optionalText(40),
  healthInsuranceNumber: optionalText(100),
  hasAllergies: z.enum(["yes", "no"]),
  allergiesDetails: optionalText(500),
  hasMedicalConditions: z.enum(["yes", "no"]),
  medicalConditionsDetails: optionalText(500),
  submittedBirthCertificate: check.default(false),
  submittedProofOfAddress: check.default(false),
  submittedNhis: check.default(false),
  certifyAccuracy: check.refine(Boolean, "Confirm that the application information is accurate."),
  consentEmergencyTreatment: check.refine(Boolean, "Emergency medical consent is required."),
  acknowledgeNoGuarantee: check.refine(Boolean, "Confirm that application submission does not guarantee admission."),
  notes: optionalText(1000)
}).superRefine((values, ctx) => {
  if (values.hasAllergies === "yes" && !values.allergiesDetails) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["allergiesDetails"], message: "List the learner's allergies." });
  }
  if (values.hasMedicalConditions === "yes" && !values.medicalConditionsDetails) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["medicalConditionsDetails"], message: "List the learner's medical conditions." });
  }
});
