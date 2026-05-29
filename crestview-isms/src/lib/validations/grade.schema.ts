import { z } from "zod";

export const gradeSchema = z.object({
  gradeItemId: z.string().uuid(),
  studentId: z.string().uuid(),
  score: z.coerce.number().min(0),
  comments: z.string().max(1000).optional()
});
