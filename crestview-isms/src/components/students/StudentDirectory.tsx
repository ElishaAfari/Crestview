import Link from "next/link";
import { ArrowRight, Download, GraduationCap, LayoutGrid, List, Plus, Search, Upload, Users, UserCheck, UserMinus } from "lucide-react";
import { directoryHref, type DirectoryFilters, type DirectoryResult, type SchoolClass } from "@/features/students/directory";

export function StudentDirectory({ result, classes, filters }: { result: DirectoryResult; classes: SchoolClass[]; filters: DirectoryFilters }) {
  const { students, stats, total } = result;
  const maxPage = Math.max(1, Math.ceil(total / 20));
  return <main className="reference-workspace">
    <header className="ref-page-heading">
      <div><h1><Users aria-hidden />Students</h1><p>Manage student records, enrollments, and profiles.</p></div>
      <div className="ref-actions">
        <Link className="ref-button" href="/students/import"><Upload size={16} aria-hidden />Import</Link>
        <a className="ref-button" href={`/api/students/export?${directoryHref(filters).split("?")[1]}`}><Download size={16} aria-hidden />Export</a>
        <Link className="ref-button ref-primary" href="/students/new"><Plus size={16} aria-hidden />Add Student</Link>
      </div>
    </header>
    <nav className="ref-tabs" aria-label="Student workspace">
      <Link href="/students" aria-current="page">All Students</Link>
      <Link href="/students/promotions">Promotions</Link>
      <Link href="/students/guardian-links">Guardians</Link>
      <Link href="/students/academic-reports">Reports</Link>
    </nav>
    <div className="ref-stats">
      {[
        { title: "Total Students", value: stats.total, note: `${stats.male} male, ${stats.female} female`, icon: Users },
        { title: "Active", value: stats.active, note: "Currently enrolled", icon: UserCheck },
        { title: "Graduated", value: stats.graduated, note: "Completed their journey", icon: GraduationCap },
        { title: "Withdrawn & suspended", value: stats.inactive, note: "Inactive enrollments", icon: UserMinus }
      ].map(({ title, value, note, icon: Icon }) => <article key={title} className="ref-stat"><span><Icon size={16} aria-hidden />{title}</span><strong>{value}</strong><p>{note}</p></article>)}
    </div>
    <form className="ref-filters" action="/students">
      <label className="ref-search"><Search size={16} aria-hidden /><input name="q" type="search" defaultValue={filters.q} placeholder="Search student name or ID..." aria-label="Search students" maxLength={120} /></label>
      <select name="status" aria-label="Filter by status" defaultValue={filters.status}><option value="">All statuses</option><option value="active">Active</option><option value="graduated">Graduated</option><option value="withdrawn">Withdrawn</option><option value="suspended">Suspended</option></select>
      <select name="classroom" aria-label="Filter by class" defaultValue={filters.classroom}><option value="">All classes</option>{classes.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select>
      <select name="gender" aria-label="Filter by gender" defaultValue={filters.gender}><option value="">All genders</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Not disclosed</option></select>
      <input type="hidden" name="view" value={filters.view} />
      <button className="ref-button ref-primary" type="submit">Search</button>
      <Link className="ref-button" href="/students">Reset</Link>
      <div className="ref-view-toggle" aria-label="Directory view">
        <Link href={directoryHref(filters, { view: "table" })} className="ref-icon-button" aria-label="Table view" title="Table view" aria-current={filters.view === "table" ? "true" : undefined}><List size={18} /></Link>
        <Link href={directoryHref(filters, { view: "cards" })} className="ref-icon-button" aria-label="Card view" title="Card view" aria-current={filters.view === "cards" ? "true" : undefined}><LayoutGrid size={18} /></Link>
      </div>
    </form>
    <section aria-label="Student Directory">
      <div className="ref-section-title"><h2>Student Directory</h2><span>{total} students</span></div>
      {filters.view === "table" ? <div className="ref-table-scroll" tabIndex={0} role="region" aria-label="Scrollable student directory"><table className="ref-table"><thead><tr><th>Student</th><th>Student ID</th><th>Class</th><th>Gender</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {students.map(s => <tr key={s.id}><td><Link className="ref-person" href={`/admin/student-360/${s.id}`}><span className="ref-avatar">{s.name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("")}</span>{s.name}</Link></td><td>{s.student_number}</td><td>{s.classroom ?? "Unassigned"}</td><td className="capitalize">{s.gender?.replaceAll("_", " ") ?? "Not recorded"}</td><td><span className={`ref-status ref-status-${s.status}`}>{s.status}</span></td><td><Link className="ref-icon-button" href={`/admin/student-360/${s.id}`} title={`Open ${s.name}`} aria-label={`Open ${s.name}`}><ArrowRight size={16} /></Link></td></tr>)}
        {!students.length && <tr><td colSpan={6} className="ref-empty">No students match these filters.</td></tr>}
      </tbody></table></div> : <div className="ref-student-grid">{students.map(s => <article className="ref-student-card" key={s.id}><div className="ref-section-title"><h3>{s.name}</h3><span className={`ref-status ref-status-${s.status}`}>{s.status}</span></div><p>{s.student_number}</p><p>{s.classroom ?? "Unassigned"}</p><Link className="ref-button" href={`/admin/student-360/${s.id}`}>View profile<ArrowRight size={16} /></Link></article>)}{!students.length && <p className="ref-empty">No students match these filters.</p>}</div>}
      <footer className="ref-pagination"><span>{total ? `Showing ${(filters.page - 1) * 20 + 1} to ${Math.min(filters.page * 20, total)} of ${total} students` : "No students"}</span><div className="ref-actions">
        {filters.page > 1 ? <Link className="ref-button" href={directoryHref(filters, { page: filters.page - 1 })}>Previous</Link> : <button className="ref-button" disabled>Previous</button>}
        <span>Page {filters.page} of {maxPage}</span>
        {filters.page < maxPage ? <Link className="ref-button" href={directoryHref(filters, { page: filters.page + 1 })}>Next</Link> : <button className="ref-button" disabled>Next</button>}
      </div></footer>
    </section>
  </main>;
}
