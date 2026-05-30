import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().max(40, "Enter a shorter phone number.").optional(),
  subject: z.string().trim().max(160, "Enter a shorter subject.").optional(),
  message: z.string().trim().min(10, "Tell us a little more.").max(5000, "Your message is too long.")
});
