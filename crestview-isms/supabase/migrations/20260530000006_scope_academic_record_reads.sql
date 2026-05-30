CREATE OR REPLACE FUNCTION private.can_access_classroom(classroom_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE(
    private.is_academic_staff()
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.classroom_id = classroom_uuid
        AND s.deleted_at IS NULL
        AND private.can_access_student(s.id)
    ),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION private.can_access_course(course_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE(
    private.is_academic_staff()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = course_uuid
        AND c.deleted_at IS NULL
        AND private.can_access_classroom(c.classroom_id)
    ),
    FALSE
  );
$$;

REVOKE ALL ON FUNCTION private.can_access_classroom(UUID), private.can_access_course(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_access_classroom(UUID), private.can_access_course(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS teacher_assignments_academic_read ON public.teacher_assignments;
CREATE POLICY teacher_assignments_academic_read ON public.teacher_assignments
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (private.is_admin() OR teacher_id = auth.uid()));

DROP POLICY IF EXISTS assignments_academic_read ON public.assignments;
CREATE POLICY assignments_academic_read ON public.assignments
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND private.can_access_course(course_id));

DROP POLICY IF EXISTS grade_items_academic_read ON public.grade_items;
CREATE POLICY grade_items_academic_read ON public.grade_items
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND private.can_access_course(course_id));

DROP POLICY IF EXISTS timetables_academic_read ON public.timetables;
CREATE POLICY timetables_academic_read ON public.timetables
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND private.can_access_classroom(classroom_id));

DROP POLICY IF EXISTS assignment_submissions_academic_read ON public.assignment_submissions;
CREATE POLICY assignment_submissions_academic_read ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (private.is_academic_staff() OR private.can_access_student(student_id)));

DROP POLICY IF EXISTS attendance_records_academic_read ON public.attendance_records;
CREATE POLICY attendance_records_academic_read ON public.attendance_records
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (private.is_academic_staff() OR private.can_access_student(student_id)));

DROP POLICY IF EXISTS grades_academic_read ON public.grades;
CREATE POLICY grades_academic_read ON public.grades
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (private.is_academic_staff() OR private.can_access_student(student_id)));

DROP POLICY IF EXISTS reports_academic_read ON public.reports;
CREATE POLICY reports_academic_read ON public.reports
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_academic_staff()
      OR (student_id IS NOT NULL AND private.can_access_student(student_id))
      OR (student_id IS NULL AND generated_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS ai_analytics_academic_read ON public.ai_analytics;
CREATE POLICY ai_analytics_academic_read ON public.ai_analytics
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (private.is_academic_staff() OR private.can_access_student(student_id)));
