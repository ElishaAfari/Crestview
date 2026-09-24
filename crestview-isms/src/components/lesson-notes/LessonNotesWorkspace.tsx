"use client";

import { useActionState, useMemo, useState } from "react";
import { BookMarked, CheckCircle2, FilePenLine, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { reviewLessonNoteAction, saveLessonNoteAction, type LessonNoteActionState } from "@/features/lesson-notes/actions";
import type { LessonNoteCourse, LessonNoteRecord, LessonNoteReview, LessonNoteScheme } from "@/features/lesson-notes/queries";
import { canTeacherEditLessonNote, lessonNoteStatusLabel } from "@/features/lesson-notes/workflow";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: LessonNoteActionState = { ok: false, message: "" };

type Props = {
  canReview: boolean;
  courses: LessonNoteCourse[];
  schemes: LessonNoteScheme[];
  notes: LessonNoteRecord[];
  reviews: LessonNoteReview[];
};

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

function ReviewHistory({ reviews }: { reviews: LessonNoteReview[] }) {
  if (!reviews.length) return null;
  return (
    <div className="mt-3 border-t border-[var(--portal-border)] pt-3">
      <p className="text-xs font-black uppercase text-[var(--portal-muted)]">Review history</p>
      <div className="mt-2 space-y-2">
        {reviews.slice(0, 3).map((review) => (
          <p key={review.id} className="text-xs leading-5 text-[var(--portal-muted)]">
            <span className="font-black text-[var(--portal-text)]">{review.actedBy}</span> {review.decision.replaceAll("_", " ")}
            {review.comment ? `: ${review.comment}` : ""}
          </p>
        ))}
      </div>
    </div>
  );
}

function LessonNoteReviewForm({ noteId }: { noteId: string }) {
  const [state, action, pending] = useActionState(reviewLessonNoteAction, initialState);
  return (
    <form action={action} className="mt-4 space-y-3 border-t border-[var(--portal-border)] pt-4">
      <input type="hidden" name="planId" value={noteId} />
      <Label htmlFor={`review-${noteId}`}>Review comment</Label>
      <Textarea id={`review-${noteId}`} name="comment" className="min-h-20" placeholder="Required when returning a note for changes" />
      {state.message ? <p className={`text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
      <div className="flex flex-wrap gap-3"><Button type="submit" name="decision" value="approved" disabled={pending}><CheckCircle2 className="size-4" aria-hidden />Approve</Button><Button type="submit" name="decision" value="changes_requested" variant="secondary" disabled={pending}><RotateCcw className="size-4" aria-hidden />Return for changes</Button></div>
    </form>
  );
}

export function LessonNotesWorkspace({ canReview, courses, schemes, notes, reviews }: Props) {
  const [editing, setEditing] = useState<LessonNoteRecord | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [state, formAction, pending] = useActionState(saveLessonNoteAction, initialState);
  const courseOptions = courses;
  const plannedFor = editing?.plannedFor ?? new Date().toISOString().slice(0, 10);
  const activeCourseId = selectedCourseId || editing?.courseId || courseOptions[0]?.id || "";
  const schemeOptions = useMemo(() => schemes.filter((scheme) => scheme.courseId === activeCourseId), [activeCourseId, schemes]);
  const submitted = notes.filter((note) => note.reviewStatus === "submitted");
  const approved = notes.filter((note) => note.reviewStatus === "approved");

  if (!courses.length && !canReview) {
    return (
      <Card>
        <CardHeader><CardTitle>No teaching assignment yet</CardTitle></CardHeader>
        <CardContent><p className="text-sm font-semibold text-[var(--portal-muted)]">Ask a primary administrator to assign you to a class and subject before creating a scheme or lesson note.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="portal-accent-blue"><CardContent className="p-5"><p className="text-sm font-black text-[var(--portal-muted)]">My lesson notes</p><p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{notes.length}</p><p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">Drafts, submitted notes, and decisions</p></CardContent></Card>
        <Card className="portal-accent-amber"><CardContent className="p-5"><p className="text-sm font-black text-[var(--portal-muted)]">Awaiting review</p><p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{submitted.length}</p><p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">{canReview ? "Ready for an administrator decision" : "Submitted to the academic office"}</p></CardContent></Card>
        <Card className="portal-accent-green"><CardContent className="p-5"><p className="text-sm font-black text-[var(--portal-muted)]">Approved</p><p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{approved.length}</p><p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">Ready for classroom delivery</p></CardContent></Card>
      </section>

      {!canReview ? (
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div><CardTitle>{editing ? "Revise lesson note" : "Write lesson note"}</CardTitle><p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">Link the note to your assigned class and the weekly scheme before submitting it for vetting.</p></div>
            {editing ? <Button type="button" variant="secondary" onClick={() => { setEditing(null); setSelectedCourseId(""); }}><RotateCcw className="size-4" aria-hidden />New note</Button> : null}
          </CardHeader>
          <CardContent>
            <form key={editing?.id ?? "new"} action={formAction} className="grid gap-4">
              <input type="hidden" name="planId" value={editing?.id ?? ""} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2"><Label htmlFor="courseId">Assigned class and subject</Label><Select id="courseId" name="courseId" required defaultValue={editing?.courseId ?? courseOptions[0]?.id ?? ""} onChange={(event) => setSelectedCourseId(event.target.value)}><option value="" disabled>Select a class and subject</option>{courseOptions.map((course) => <option key={course.id} value={course.id}>{course.label}</option>)}</Select></div>
                <div className="grid gap-2"><Label htmlFor="schemeId">Scheme of work week</Label><Select id="schemeId" name="schemeId" defaultValue={editing?.schemeId ?? ""}><option value="">No weekly scheme selected</option>{schemeOptions.map((scheme) => <option key={scheme.id} value={scheme.id}>{scheme.label}</option>)}</Select></div>
                <div className="grid gap-2"><Label htmlFor="title">Lesson title</Label><Input id="title" name="title" required defaultValue={editing?.title ?? ""} placeholder="Comparing fractions" /></div>
                <div className="grid gap-2"><Label htmlFor="plannedFor">Teaching date</Label><Input id="plannedFor" name="plannedFor" type="date" required defaultValue={plannedFor} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="objectives">Learning objectives</Label><Textarea id="objectives" name="objectives" required defaultValue={editing?.objectives.join("\n") ?? ""} placeholder="One objective per line" /></div>
              <div className="grid gap-2"><Label htmlFor="activities">Learning activities</Label><Textarea id="activities" name="activities" required defaultValue={editing?.activities ?? ""} placeholder="Starter, teacher input, guided practice, independent work, assessment for learning" /></div>
              <div className="grid gap-2"><Label htmlFor="lessonNote">Detailed lesson note</Label><Textarea id="lessonNote" name="lessonNote" required className="min-h-52" defaultValue={editing?.lessonNote ?? ""} placeholder="Write the teaching sequence, inclusion support, assessment checks, and expected learner responses." /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2"><Label htmlFor="resources">Resources</Label><Textarea id="resources" name="resources" className="min-h-24" defaultValue={editing?.resources ?? ""} placeholder="Textbook pages, manipulatives, projector, worksheet" /></div>
                <div className="grid gap-2"><Label htmlFor="homework">Homework or extension</Label><Textarea id="homework" name="homework" className="min-h-24" defaultValue={editing?.homework ?? ""} placeholder="Optional follow-up task" /></div>
              </div>
              {state.message ? <p className={`text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
              <div className="flex flex-wrap gap-3"><Button type="submit" name="intent" value="draft" variant="secondary" disabled={pending}><FilePenLine className="size-4" aria-hidden />{pending ? "Saving..." : "Save draft"}</Button><Button type="submit" name="intent" value="submit" disabled={pending}><Send className="size-4" aria-hidden />Submit for vetting</Button></div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>{canReview ? "Lesson note review queue" : "My lesson note register"}</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">{canReview ? "Review submitted notes, approve a ready lesson, or return it with clear changes." : "Draft notes can be edited. Submitted and approved notes retain their audit trail."}</p></CardHeader>
        <CardContent>
          {notes.length ? <div className="grid gap-4 lg:grid-cols-2">{notes.map((note) => {
            const noteReviews = reviews.filter((review) => review.lessonPlanId === note.id);
            const editable = !canReview && canTeacherEditLessonNote(note.reviewStatus);
            return <article key={note.id} className="rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-heading text-lg font-black text-[var(--portal-text)]">{note.title}</p><p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">{note.courseLabel}</p></div><StatusBadge status={lessonNoteStatusLabel(note.reviewStatus)} /></div><div className="mt-4 grid gap-2 text-sm"><p><span className="font-black text-[var(--portal-text)]">Date:</span> <span className="text-[var(--portal-muted)]">{formatDate(note.plannedFor)}</span></p>{note.schemeLabel ? <p><span className="font-black text-[var(--portal-text)]">Scheme:</span> <span className="text-[var(--portal-muted)]">{note.schemeLabel}</span></p> : null}<p><span className="font-black text-[var(--portal-text)]">Teacher:</span> <span className="text-[var(--portal-muted)]">{note.author}</span></p>{note.reviewComment ? <p className="rounded-md bg-amber-50 p-3 font-semibold text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><span className="font-black">Reviewer feedback:</span> {note.reviewComment}</p> : null}</div>{editable ? <Button className="mt-4" variant="secondary" onClick={() => { setEditing(note); setSelectedCourseId(note.courseId); }}><FilePenLine className="size-4" aria-hidden />Edit note</Button> : null}{canReview && note.reviewStatus === "submitted" ? <LessonNoteReviewForm noteId={note.id} /> : null}<ReviewHistory reviews={noteReviews} /></article>;
          })}</div> : <div className="portal-empty-state"><BookMarked className="mx-auto size-8 text-[var(--portal-accent)]" aria-hidden /><h3>No lesson notes yet</h3><p>{canReview ? "Submitted lesson notes will appear here for vetting." : "Write your first lesson note and submit it to the academic office."}</p></div>}
        </CardContent>
      </Card>

      {canReview ? <div className="portal-subtle-card flex items-start gap-3 rounded-lg p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--portal-accent)]" aria-hidden /><p className="text-sm font-semibold leading-6 text-[var(--portal-muted)]">Approval makes a lesson note ready for delivery. Returning it for changes leaves the teacher&apos;s original work and feedback visible, ready for a revised submission.</p></div> : null}
    </div>
  );
}
