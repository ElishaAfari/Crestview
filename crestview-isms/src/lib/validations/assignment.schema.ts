import { z } from "zod";

export const assignmentSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().max(5000).optional(),
  dueAt: z.string().datetime().optional(),
  maxScore: z.coerce.number().positive().max(1000)
});
