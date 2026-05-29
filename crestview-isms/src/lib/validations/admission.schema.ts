import { z } from "zod";

export const admissionSchema = z.object({
  applicantFirstName: z.string().min(2),
  applicantLastName: z.string().min(2),
  applyingGrade: z.string().min(2),
  guardianEmail: z.string().email(),
  guardianPhone: z.string().min(7),
  notes: z.string().max(1000).optional()
});
