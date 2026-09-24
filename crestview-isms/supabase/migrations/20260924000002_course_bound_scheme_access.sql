-- Scope schemes to teaching assignments. A teacher may read schemes for an
-- assigned course, but may only change schemes they authored for that course.
DROP POLICY IF EXISTS class_subject_schemes_academic_manage ON public.class_subject_schemes;
DROP POLICY IF EXISTS class_subject_schemes_read ON public.class_subject_schemes;
DROP POLICY IF EXISTS class_subject_schemes_insert ON public.class_subject_schemes;
DROP POLICY IF EXISTS class_subject_schemes_update ON public.class_subject_schemes;

CREATE POLICY class_subject_schemes_read ON public.class_subject_schemes
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.has_role(ARRAY['super_admin', 'school_owner', 'school_admin'])
      OR EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.classroom_id = class_subject_schemes.classroom_id
          AND c.subject_id = class_subject_schemes.subject_id
          AND c.deleted_at IS NULL
          AND (
            c.teacher_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.teacher_assignments ta
              WHERE ta.course_id = c.id
                AND ta.teacher_id = auth.uid()
                AND ta.deleted_at IS NULL
            )
          )
      )
    )
  );

CREATE POLICY class_subject_schemes_insert ON public.class_subject_schemes
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_role(ARRAY['super_admin', 'school_owner', 'school_admin'])
    OR (
      private.has_role(ARRAY['teacher'])
      AND created_by = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.classroom_id = class_subject_schemes.classroom_id
          AND c.subject_id = class_subject_schemes.subject_id
          AND c.deleted_at IS NULL
          AND (
            c.teacher_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.teacher_assignments ta
              WHERE ta.course_id = c.id
                AND ta.teacher_id = auth.uid()
                AND ta.deleted_at IS NULL
            )
          )
      )
    )
  );

CREATE POLICY class_subject_schemes_update ON public.class_subject_schemes
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.has_role(ARRAY['super_admin', 'school_owner', 'school_admin'])
      OR (private.has_role(ARRAY['teacher']) AND created_by = auth.uid())
    )
  )
  WITH CHECK (
    private.has_role(ARRAY['super_admin', 'school_owner', 'school_admin'])
    OR (
      private.has_role(ARRAY['teacher'])
      AND created_by = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.classroom_id = class_subject_schemes.classroom_id
          AND c.subject_id = class_subject_schemes.subject_id
          AND c.deleted_at IS NULL
          AND (
            c.teacher_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.teacher_assignments ta
              WHERE ta.course_id = c.id
                AND ta.teacher_id = auth.uid()
                AND ta.deleted_at IS NULL
            )
          )
      )
    )
  );
