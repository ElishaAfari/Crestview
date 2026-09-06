import { NextRequest } from "next/server";
import { requireRoles } from "@/features/auth/guards";
import { csvCell, parseDirectoryFilters, type DirectoryResult } from "@/features/students/directory";

export async function GET(request: NextRequest) {
  const { supabase } = await requireRoles(["super_admin", "school_admin"]);
  let filters;
  try { filters = parseDirectoryFilters(Object.fromEntries(request.nextUrl.searchParams)); }
  catch { return Response.json({ error: "Invalid export filters." }, { status: 400 }); }
  const lines = [["Student ID", "Student", "Class", "Gender", "Status"].map(csvCell).join(",")];
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.rpc("search_student_directory", {
      p_search: filters.q, p_status: filters.status, p_classroom: filters.classroom || null,
      p_gender: filters.gender, p_page: page, p_page_size: 100
    });
    if (error) return Response.json({ error: "The student export could not be completed." }, { status: 500 });
    const result = data as DirectoryResult;
    lines.push(...result.students.map(s => [s.student_number, s.name, s.classroom, s.gender, s.status].map(csvCell).join(",")));
    if (page * 100 >= result.total) break;
    if (page >= 500) return Response.json({ error: "Narrow the filters to export fewer than 50,000 students." }, { status: 422 });
  }
  return new Response(`\uFEFF${lines.join("\r\n")}`, { headers: {
    "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="crestview-students.csv"',
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"
  } });
}
