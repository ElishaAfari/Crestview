"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createPromotionRunAction, completePromotionRunAction, type PromotionActionState } from "@/features/students/promotion-actions";
import type { PromotionRun, PromotionStudent, SchoolClass, SchoolYear } from "@/features/students/directory";

const initialState: PromotionActionState = { ok: false, message: "" };

function CreateBatchForm({ years }: { years: SchoolYear[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createPromotionRunAction, initialState);
  useEffect(() => { if (state.ok && state.runId) router.push(`/students/promotions?runId=${state.runId}`); }, [router, state.ok, state.runId]);
  return <form action={action} className="ref-form-grid">
    <label><span>Batch name</span><Input name="name" placeholder="2026/2027 end-of-year promotion" required minLength={3} maxLength={120} /></label>
    <label><span>Source academic year</span><Select name="sourceYear" required defaultValue=""><option value="">Select source year</option>{years.map(year => <option key={year.id} value={year.id}>{year.name}{year.is_current ? " Current" : ""}</option>)}</Select></label>
    <label><span>Target academic year</span><Select name="targetYear" required defaultValue=""><option value="">Select target year</option>{years.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}</Select></label>
    <div className="ref-form-actions"><Button type="submit" disabled={pending}><Plus size={16} aria-hidden />{pending ? "Creating batch..." : "Create batch"}</Button>{state.message && <p className={state.ok ? "ref-success" : "ref-error"}>{state.message}</p>}</div>
  </form>;
}

function ReviewBatch({ run, students, classes }: { run: PromotionRun; students: PromotionStudent[]; classes: SchoolClass[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(completePromotionRunAction, initialState);
  const sourceIds = useMemo(() => Array.from(new Set(students.map(student => student.source_classroom_id))), [students]);
  const [mappings, setMappings] = useState<Record<string, string>>(() => Object.fromEntries(sourceIds.map(id => [id, ""])));
  const [excluded, setExcluded] = useState<string[]>(() => students.filter(student => student.outcome === "excluded").map(student => student.student_id));
  useEffect(() => { if (state.ok) router.refresh(); }, [router, state.ok]);
  const sourceClass = (id: string) => classes.find(item => item.id === id);
  const targetClasses = classes.filter(item => item.academic_year_id === run.target_year_id);
  const includedCount = students.filter(student => !excluded.includes(student.student_id)).length;
  return <>
    <section className="ref-panel">
      <div className="ref-section-title"><div><h2>Review promotion batch</h2><p>{run.name} · {students.length} students frozen into this batch.</p></div><span className={`ref-status ref-status-${run.status}`}>{run.status}</span></div>
      {run.status === "draft" ? <>
        <div className="ref-mapping-grid"><div><h3>Class destinations</h3><p className="ref-help">Each source class can be mapped once. The transaction checks target year, capacity, and roster changes before saving.</p></div>{sourceIds.map(id => <label key={id}><span>{sourceClass(id)?.name ?? "Source class"}</span><Select value={mappings[id] ?? ""} onChange={event => setMappings(current => ({ ...current, [id]: event.target.value }))}><option value="">Select destination</option>{targetClasses.map(item => <option value={item.id} key={item.id}>{item.name} · {item.grade_level}</option>)}</Select></label>)}</div>
        <div className="ref-section-title"><div><h3>Students included</h3><p className="ref-help">Uncheck a student only when the student should remain outside this promotion run.</p></div><span>{includedCount} included</span></div>
        <div className="ref-table-scroll" tabIndex={0} role="region" aria-label="Promotion student list"><table className="ref-table"><thead><tr><th>Include</th><th>Student</th><th>Student ID</th><th>Current class</th><th>Destination</th></tr></thead><tbody>{students.map(student => <tr key={student.student_id}><td><input type="checkbox" checked={!excluded.includes(student.student_id)} onChange={event => setExcluded(current => event.target.checked ? current.filter(id => id !== student.student_id) : [...current, student.student_id])} aria-label={`Include ${student.name}`} /></td><td>{student.name}</td><td>{student.student_number}</td><td>{sourceClass(student.source_classroom_id)?.name ?? "Unknown"}</td><td>{targetClasses.find(item => item.id === mappings[student.source_classroom_id])?.name ?? "Not mapped"}</td></tr>)}</tbody></table></div>
        <form action={action} className="ref-form-actions"><input type="hidden" name="runId" value={run.id} /><input type="hidden" name="mappings" value={JSON.stringify(mappings)} /><input type="hidden" name="excluded" value={JSON.stringify(excluded)} /><Button type="submit" disabled={pending || includedCount === 0}><CheckCircle2 size={16} aria-hidden />{pending ? "Completing batch..." : "Complete promotion batch"}</Button>{state.message && <p className={state.ok ? "ref-success" : "ref-error"}>{state.message}</p>}</form>
      </> : <div className="ref-success-panel"><CheckCircle2 size={20} aria-hidden /><div><strong>This batch is complete.</strong><p>Class placements, enrollment history, snapshots, audit records, and notifications were updated together.</p></div></div>}
    </section>
  </>;
}

export function PromotionWorkspace({ years, classes, runs, selected, students }: { years: SchoolYear[]; classes: SchoolClass[]; runs: PromotionRun[]; selected: PromotionRun | null; students: PromotionStudent[] }) {
  const router = useRouter();
  return <main className="reference-workspace">
    <header className="ref-page-heading"><div><h1><ClipboardList aria-hidden />Promotions</h1><p>Manage end-of-year class promotions.</p></div><Button variant="default" onClick={() => router.push("/students/promotions#new-batch")}><Plus size={16} aria-hidden />Create batch</Button></header>
    <nav className="ref-tabs" aria-label="Student workspace"><Link href="/students">All Students</Link><Link href="/students/promotions" aria-current="page">Promotions</Link><Link href="/students/guardian-links">Guardians</Link><Link href="/students/academic-reports">Reports</Link></nav>
    <section className="ref-panel" id="new-batch"><div className="ref-section-title"><div><h2>Create promotion batch</h2><p>Create a new class promotion batch for the end-of-year transition.</p></div><RefreshCw size={18} aria-hidden /></div><CreateBatchForm years={years} /></section>
    {selected ? <ReviewBatch run={selected} students={students} classes={classes} /> : <section className="ref-panel"><div className="ref-section-title"><div><h2>Promotion batches</h2><p>Review an existing batch to map classes and complete the transition.</p></div><span>{runs.length} batches</span></div>{runs.length ? <div className="ref-table-scroll" tabIndex={0} role="region" aria-label="Promotion batches"><table className="ref-table"><thead><tr><th>Batch</th><th>Source year</th><th>Target year</th><th>Status</th><th>Created</th><th /></tr></thead><tbody>{runs.map(run => <tr key={run.id}><td>{run.name}</td><td>{years.find(year => year.id === run.source_year_id)?.name ?? "Unknown"}</td><td>{years.find(year => year.id === run.target_year_id)?.name ?? "Unknown"}</td><td><span className={`ref-status ref-status-${run.status}`}>{run.status}</span></td><td>{new Date(run.created_at).toLocaleDateString("en-GH")}</td><td><a className="ref-icon-button" href={`/students/promotions?runId=${run.id}`} title={`Review ${run.name}`} aria-label={`Review ${run.name}`}><ArrowRight size={16} /></a></td></tr>)}</tbody></table></div> : <div className="ref-empty"><ClipboardList size={22} aria-hidden /><p>No promotion batches</p><span>Create a promotion batch to manage class promotions.</span></div>}</section>}
  </main>;
}
