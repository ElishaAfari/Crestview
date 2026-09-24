"use client";

import { useActionState, useState } from "react";
import { BookOpenCheck, FilePenLine, RotateCcw } from "lucide-react";
import { saveSchemeOfWorkAction, type LessonNoteActionState } from "@/features/lesson-notes/actions";
import type { LessonNoteCourse, SchemeOfWorkRecord } from "@/features/lesson-notes/queries";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: LessonNoteActionState = { ok: false, message: "" };

type Props = { canReview: boolean; courses: LessonNoteCourse[]; records: SchemeOfWorkRecord[] };

export function SchemesOfWorkWorkspace({ canReview, courses, records }: Props) {
  const [editing, setEditing] = useState<SchemeOfWorkRecord | null>(null);
  const [state, formAction, pending] = useActionState(saveSchemeOfWorkAction, initialState);

  if (!courses.length) {
    return <Card><CardHeader><CardTitle>No course assignments available</CardTitle></CardHeader><CardContent><p className="text-sm font-semibold text-[var(--portal-muted)]">Assign a teacher to a class and subject before creating a weekly scheme of work.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="portal-accent-blue"><CardContent className="p-5"><p className="text-sm font-black text-[var(--portal-muted)]">Weekly schemes</p><p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{records.length}</p><p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">Linked to a class, subject, and term</p></CardContent></Card>
        <Card className="portal-accent-green"><CardContent className="p-5"><p className="text-sm font-black text-[var(--portal-muted)]">Active</p><p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{records.filter((record) => record.status === "active").length}</p><p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">Available for current lesson notes</p></CardContent></Card>
        <Card className="portal-accent-amber"><CardContent className="p-5"><p className="text-sm font-black text-[var(--portal-muted)]">Planned</p><p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{records.filter((record) => record.status === "planned").length}</p><p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">Ready to activate for the term</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0"><div><CardTitle>{editing ? "Update weekly scheme" : "Create weekly scheme of work"}</CardTitle><p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">Each week is tied to the actual assigned course, so teachers can select it while preparing lesson notes.</p></div>{editing ? <Button type="button" variant="secondary" onClick={() => setEditing(null)}><RotateCcw className="size-4" aria-hidden />New scheme</Button> : null}</CardHeader>
        <CardContent>
          <form key={editing?.id ?? "new"} action={formAction} className="grid gap-4">
            <input type="hidden" name="schemeId" value={editing?.id ?? ""} />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2 md:col-span-2"><Label htmlFor="courseId">Class, subject, and term</Label><Select id="courseId" name="courseId" required defaultValue={editing?.courseId ?? courses[0]?.id ?? ""}>{courses.map((course) => <option key={course.id} value={course.id}>{course.label}</option>)}</Select></div>
              <div className="grid gap-2"><Label htmlFor="weekNumber">Week number</Label><Input id="weekNumber" name="weekNumber" type="number" min="1" max="16" required defaultValue={editing?.weekNumber ?? 1} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="grid gap-2"><Label htmlFor="topic">Weekly topic</Label><Input id="topic" name="topic" required defaultValue={editing?.topic ?? ""} placeholder="Place value to 10,000" /></div>
              <div className="grid gap-2"><Label htmlFor="status">Status</Label><Select id="status" name="status" defaultValue={editing?.status ?? "planned"}><option value="planned">Planned</option><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></Select></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2"><div className="grid gap-2"><Label htmlFor="objectives">Learning objectives</Label><Textarea id="objectives" name="objectives" defaultValue={editing?.objectives ?? ""} placeholder="Expected learner outcomes for the week" /></div><div className="grid gap-2"><Label htmlFor="resources">Resources</Label><Textarea id="resources" name="resources" defaultValue={editing?.resources ?? ""} placeholder="Textbook, practical material, digital resource" /></div></div>
            {state.message ? <p className={`text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
            <Button type="submit" className="w-fit" disabled={pending}><BookOpenCheck className="size-4" aria-hidden />{pending ? "Saving..." : editing ? "Update scheme" : "Save scheme"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{canReview ? "School scheme register" : "My scheme of work register"}</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Open an entry to revise it before it is used in a lesson note.</p></CardHeader>
        <CardContent>{records.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[var(--portal-border)] text-xs uppercase text-[var(--portal-muted)]"><tr><th className="px-3 py-3">Week</th><th className="px-3 py-3">Course</th><th className="px-3 py-3">Topic</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Teacher</th><th className="px-3 py-3"><span className="sr-only">Action</span></th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-b border-[var(--portal-border)] last:border-0"><td className="px-3 py-3 font-black text-[var(--portal-text)]">{record.weekNumber}</td><td className="max-w-72 px-3 py-3 font-semibold text-[var(--portal-muted)]">{record.courseLabel}</td><td className="px-3 py-3 font-semibold text-[var(--portal-text)]">{record.topic}</td><td className="px-3 py-3"><StatusBadge status={record.status} /></td><td className="px-3 py-3 font-semibold text-[var(--portal-muted)]">{record.author}</td><td className="px-3 py-3"><Button type="button" size="sm" variant="secondary" onClick={() => setEditing(record)}><FilePenLine className="size-4" aria-hidden />Edit</Button></td></tr>)}</tbody></table></div> : <div className="portal-empty-state"><BookOpenCheck className="mx-auto size-8 text-[var(--portal-accent)]" aria-hidden /><h3>No weekly schemes yet</h3><p>Create a class and subject scheme, then teachers can connect their lesson notes to that weekly plan.</p></div>}</CardContent>
      </Card>
    </div>
  );
}
