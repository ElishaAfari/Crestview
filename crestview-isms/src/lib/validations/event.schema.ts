import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startsAt: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid start time."),
  endsAt: z.string().refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Enter a valid end time.").optional(),
  audience: z.string().min(2)
}).refine((value) => !value.endsAt || new Date(value.endsAt) >= new Date(value.startsAt), {
  message: "The end time must be after the start time.",
  path: ["endsAt"]
});
