import { z } from "zod";

export const inviteRoleSchema = z.enum([
  "school_admin",
  "teacher",
  "student",
  "parent",
  "hr_staff",
  "finance_officer",
  "librarian",
  "it_support"
]);

export const managedRoleSchema = z.enum([
  "super_admin",
  ...inviteRoleSchema.options
]);

export const bootstrapAdminSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name."),
  lastName: z.string().trim().min(2, "Enter your last name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(10, "Use at least 10 characters."),
  confirmPassword: z.string().min(10, "Confirm your password."),
  setupCode: z.string().trim().min(8, "Enter the setup code.")
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"]
});

export const portalInviteSchema = z.object({
  firstName: z.string().trim().min(2, "Enter the first name."),
  lastName: z.string().trim().min(2, "Enter the last name."),
  email: z.string().trim().email("Enter a valid email address."),
  role: inviteRoleSchema
});

export const updatePortalAccountSchema = z.object({
  accountId: z.string().uuid("Select a valid portal account."),
  role: managedRoleSchema,
  status: z.enum(["active", "disabled"])
});

export const resendPortalAccessSchema = z.object({
  accountId: z.string().uuid("Select a valid portal account.")
});
