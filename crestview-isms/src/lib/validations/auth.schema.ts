import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email address or student ID."),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.enum(["student", "parent", "teacher"])
});

export const resetPasswordSchema = z.object({
  email: z.string().email()
});

export const updatePasswordSchema = z.object({
  password: z.string().min(10, "Use at least 10 characters."),
  confirmPassword: z.string().min(10, "Confirm your new password.")
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"]
});
