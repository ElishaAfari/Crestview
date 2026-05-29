import { z } from "zod";

export const feeSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.coerce.number().min(0),
  currency: z.string().length(3),
  dueDate: z.string().date()
});
