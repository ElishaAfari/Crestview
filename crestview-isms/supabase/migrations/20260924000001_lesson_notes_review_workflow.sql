-- Teacher-authored lesson notes are linked to a course and optional weekly scheme.
-- The review fields preserve a concise, auditable draft -> submitted -> decision workflow.
ALTER TABLE public.lesson_plans
  ADD COLUMN IF NOT EXISTS scheme_id UUID REFERENCES public.class_subject_schemes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lesson_note TEXT,
  ADD COLUMN IF NOT EXISTS resources TEXT,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'submitted', 'approved', 'changes_requested')),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_comment TEXT,
  ADD COLUMN IF NOT EXISTS revision_number INTEGER NOT NULL DEFAULT 1 CHECK (revision_number > 0);

CREATE TABLE IF NOT EXISTS public.lesson_note_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id UUID NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('submitted', 'approved', 'changes_requested')),
  comment TEXT,
  acted_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_review_queue
  ON public.lesson_plans(review_status, planned_for DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_note_reviews_plan
  ON public.lesson_note_reviews(lesson_plan_id, created_at DESC);

ALTER TABLE public.lesson_note_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lesson_plans_academic_read ON public.lesson_plans;
DROP POLICY IF EXISTS lesson_plans_academic_manage ON public.lesson_plans;
DROP POLICY IF EXISTS lesson_plans_review_read ON public.lesson_plans;
DROP POLICY IF EXISTS lesson_plans_review_insert ON public.lesson_plans;
DROP POLICY IF EXISTS lesson_plans_review_update ON public.lesson_plans;

CREATE POLICY lesson_plans_review_read ON public.lesson_plans
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.has_role(ARRAY['super_admin', 'school_owner', 'school_admin'])
      OR created_by = auth.uid()
    )
  );

CREATE POLICY lesson_plans_review_insert ON public.lesson_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_role(ARRAY['super_admin', 'school_owner', 'school_admin'])
    OR (
      private.has_role(ARRAY['teacher'])
      AND created_by = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = course_id
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

CREATE POLICY lesson_plans_review_update ON public.lesson_plans
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.has_role(ARRAY['super_admin', 'school_owner', 'school_admin'])
      OR (
        created_by = auth.uid()
        AND review_status IN ('draft', 'changes_requested')
      )
    )
  )
  WITH CHECK (
    private.has_role(ARRAY['super_admin', 'school_owner', 'school_admin'])
    OR (
      private.has_role(ARRAY['teacher'])
      AND created_by = auth.uid()
      AND review_status IN ('draft', 'submitted')
      AND EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = course_id
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

DROP POLICY IF EXISTS lesson_note_reviews_read ON public.lesson_note_reviews;
DROP POLICY IF EXISTS lesson_note_reviews_admin_insert ON public.lesson_note_reviews;
DROP POLICY IF EXISTS lesson_note_reviews_teacher_submit ON public.lesson_note_reviews;

CREATE POLICY lesson_note_reviews_read ON public.lesson_note_reviews
  FOR SELECT TO authenticated
  USING (
    private.has_role(ARRAY['super_admin', 'school_owner', 'school_admin'])
    OR EXISTS (
      SELECT 1 FROM public.lesson_plans lp
      WHERE lp.id = lesson_plan_id AND lp.created_by = auth.uid()
    )
  );

CREATE POLICY lesson_note_reviews_admin_insert ON public.lesson_note_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_role(ARRAY['super_admin', 'school_owner', 'school_admin'])
    AND acted_by = auth.uid()
    AND decision IN ('approved', 'changes_requested')
  );

CREATE POLICY lesson_note_reviews_teacher_submit ON public.lesson_note_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_role(ARRAY['teacher'])
    AND acted_by = auth.uid()
    AND decision = 'submitted'
    AND EXISTS (
      SELECT 1 FROM public.lesson_plans lp
      WHERE lp.id = lesson_plan_id AND lp.created_by = auth.uid()
    )
  );
