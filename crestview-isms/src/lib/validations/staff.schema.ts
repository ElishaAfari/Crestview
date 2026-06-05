import { z } from "zod";

export const staffSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).optional(),
  staffNumber: z.string().min(3).optional(),
  jobTitle: z.string().min(2).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
  role: z.enum(["teacher", "hr_staff", "finance_officer", "librarian", "it_support"])
});
