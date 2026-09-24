import { describe, expect, it } from "vitest";
import {
  canTeacherEditLessonNote,
  lessonNoteStatusLabel,
  reviewStatusForDecision,
} from "./workflow";

describe("lesson note workflow", () => {
  it("only lets teachers edit notes that are still actionable", () => {
    expect(canTeacherEditLessonNote("draft")).toBe(true);
    expect(canTeacherEditLessonNote("changes_requested")).toBe(true);
    expect(canTeacherEditLessonNote("submitted")).toBe(false);
    expect(canTeacherEditLessonNote("approved")).toBe(false);
  });

  it("uses clear labels and review decisions", () => {
    expect(lessonNoteStatusLabel("submitted")).toBe("Awaiting review");
    expect(lessonNoteStatusLabel("changes_requested")).toBe(
      "Changes requested",
    );
    expect(reviewStatusForDecision("approved")).toBe("approved");
  });
});
