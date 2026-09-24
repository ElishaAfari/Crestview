export const LESSON_NOTE_REVIEW_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "changes_requested",
] as const;

export type LessonNoteReviewStatus =
  (typeof LESSON_NOTE_REVIEW_STATUSES)[number];

export function canTeacherEditLessonNote(status: LessonNoteReviewStatus) {
  return status === "draft" || status === "changes_requested";
}

export function lessonNoteStatusLabel(status: LessonNoteReviewStatus) {
  switch (status) {
    case "changes_requested":
      return "Changes requested";
    case "submitted":
      return "Awaiting review";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function reviewStatusForDecision(
  decision: "approved" | "changes_requested",
): LessonNoteReviewStatus {
  return decision;
}
