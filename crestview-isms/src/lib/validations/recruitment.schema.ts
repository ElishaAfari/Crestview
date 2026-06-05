import { z } from "zod";

export const jobApplicationSchema = z.object({
  jobPostingId: z.string().uuid().optional(),
  firstName: z.string().trim().min(2, "Enter your first name."),
  lastName: z.string().trim().min(2, "Enter your last name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid phone number.").optional(),
  coverLetter: z.string().trim().min(20, "Tell us a little more about your experience.").max(5000)
});
