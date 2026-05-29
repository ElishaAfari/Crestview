import { z } from "zod";

export const studentSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  studentNumber: z.string().min(4),
  classroomId: z.string().uuid(),
  enrollmentDate: z.string().date()
});
