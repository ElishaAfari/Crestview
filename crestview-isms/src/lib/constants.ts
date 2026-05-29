export const APP_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "Crestview International School";
export const APP_DESCRIPTION = "Smart school management system";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const FILE_LIMITS = {
  documentBytes: 10 * 1024 * 1024,
  imageBytes: 5 * 1024 * 1024,
  imageTypes: ["image/jpeg", "image/png", "image/webp"],
  documentTypes: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
} as const;

export const AI_LIMITS = {
  tutorRequestsPerHour: 10
} as const;
