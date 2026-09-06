import "server-only";
import { requireRoles } from "@/features/auth/guards";
import type { DirectoryFilters, DirectoryResult, PromotionRun, PromotionStudent, SchoolClass, SchoolYear } from "./directory";

export async function loadStudentDirectory(filters: DirectoryFilters) {
  const { supabase } = await requireRoles(["super_admin", "school_admin"]);
  const [result, classes] = await Promise.all([
    supabase.rpc("search_student_directory", {
      p_search: filters.q, p_status: filters.status, p_classroom: filters.classroom || null,
      p_gender: filters.gender, p_page: filters.page, p_page_size: 20
    }),
    supabase.from("classrooms").select("id,name,grade_level,academic_year_id,capacity").is("deleted_at", null).order("name")
  ]);
  if (result.error || classes.error) throw new Error("The student directory could not be loaded. Please retry.");
  return { result: result.data as DirectoryResult, classes: classes.data as SchoolClass[] };
}

export async function loadPromotionWorkspace(runId?: string) {
  const { supabase } = await requireRoles(["super_admin", "school_admin"]);
  const [years, classes, runs] = await Promise.all([
    supabase.from("academic_years").select("id,name,start_date,end_date,is_current").is("deleted_at", null).order("start_date", { ascending: false }),
    supabase.from("classrooms").select("id,name,grade_level,academic_year_id,capacity").is("deleted_at", null).order("name"),
    supabase.from("promotion_runs").select("*").order("created_at", { ascending: false }).limit(100)
  ]);
  if (years.error || classes.error || runs.error) throw new Error("Promotion batches could not be loaded. Please retry.");
  let selected: PromotionRun | null = null;
  const students: PromotionStudent[] = [];
  if (runId) {
    const { data: run, error: runError } = await supabase.from("promotion_runs").select("*").eq("id", runId).maybeSingle();
    if (runError) throw new Error("This promotion batch could not be loaded.");
    selected = run as PromotionRun | null;
    if (selected) {
      // Page through the frozen cohort so a large school is not truncated at the API row limit.
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("promotion_run_students")
          .select("student_id,source_classroom_id,target_classroom_id,outcome,students(student_number,profiles!students_profile_id_fkey(first_name,last_name))")
          .eq("run_id", runId).order("student_id").range(offset, offset + 499);
        if (error) throw new Error("The batch student list could not be loaded.");
        const rows = data as unknown as Array<Omit<PromotionStudent, "name" | "student_number"> & {
          students: { student_number: string; profiles: { first_name: string; last_name: string } | null } | null;
        }>;
        students.push(...rows.map(({ students: student, ...row }) => ({ ...row,
          name: student?.profiles ? `${student.profiles.first_name} ${student.profiles.last_name}` : "Student",
          student_number: student?.student_number ?? ""
        })));
        if (rows.length < 500) break;
      }
    }
  }
  return { years: years.data as SchoolYear[], classes: classes.data as SchoolClass[], runs: runs.data as PromotionRun[], selected, students };
}
