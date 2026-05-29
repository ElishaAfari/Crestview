import { z } from "zod";

export const staffSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).optional(),
  role: z.enum(["teacher", "hr_staff", "finance_officer", "librarian", "it_support"])
});
