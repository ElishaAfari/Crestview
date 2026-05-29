import { describe, expect, it } from "vitest";
import { admissionSchema } from "./admission.schema";
import { loginSchema } from "./auth.schema";

describe("validation schemas", () => {
  it("accepts a valid login", () => {
    expect(loginSchema.safeParse({ email: "admin@crestview.edu", password: "Admin@123" }).success).toBe(true);
  });

  it("requires a valid admission guardian email", () => {
    expect(
      admissionSchema.safeParse({
        applicantFirstName: "Amara",
        applicantLastName: "Cole",
        applyingGrade: "Grade 7",
        guardianEmail: "not-email",
        guardianPhone: "+100000000"
      }).success
    ).toBe(false);
  });
});
