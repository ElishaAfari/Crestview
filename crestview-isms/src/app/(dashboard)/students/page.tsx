import { redirect } from "next/navigation";
import { StudentDirectory } from "@/components/students/StudentDirectory";
import { directoryHref, parseDirectoryFilters } from "@/features/students/directory";
import { loadStudentDirectory } from "@/features/students/directory-queries";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let filters;
  try { filters = parseDirectoryFilters(await searchParams); } catch { redirect("/students"); }
  const data = await loadStudentDirectory(filters);
  const lastPage = Math.max(1, Math.ceil(data.result.total / 20));
  if (filters.page > lastPage) redirect(directoryHref(filters, { page: lastPage }));
  return <StudentDirectory {...data} filters={filters} />;
}
