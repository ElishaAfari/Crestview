CREATE TABLE IF NOT EXISTS public.attendance_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reopened', 'locked')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  reopened_by UUID REFERENCES public.profiles(id),
  reopened_at TIMESTAMPTZ,
  counts JSONB NOT NULL DEFAULT '{}'::JSONB,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_registers_classroom_date_active_idx
  ON public.attendance_registers(classroom_id, attendance_date)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS attendance_registers_status_date_idx
  ON public.attendance_registers(status, attendance_date DESC)
  WHERE deleted_at IS NULL;

ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS register_id UUID REFERENCES public.attendance_registers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_records_register_id
  ON public.attendance_records(register_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.class_roster_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  captured_by UUID REFERENCES public.profiles(id),
  snapshot_type TEXT NOT NULL DEFAULT 'manual' CHECK (snapshot_type IN ('manual', 'import', 'promotion', 'correction')),
  student_count INTEGER NOT NULL DEFAULT 0 CHECK (student_count >= 0),
  roster JSONB NOT NULL DEFAULT '[]'::JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS class_roster_snapshots_classroom_year_idx
  ON public.class_roster_snapshots(classroom_id, academic_year_id, created_at DESC)
  WHERE deleted_at IS NULL;

ALTER TABLE public.grade_items
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'published', 'locked')),
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB;
CREATE INDEX IF NOT EXISTS idx_grade_items_course_status
  ON public.grade_items(course_id, status)
  WHERE deleted_at IS NULL;

ALTER TABLE public.grade_import_batches
  ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS term TEXT;
CREATE INDEX IF NOT EXISTS idx_grade_import_batches_context
  ON public.grade_import_batches(classroom_id, subject_id, term, created_at DESC)
  WHERE deleted_at IS NULL;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['attendance_registers', 'class_roster_snapshots']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.set_updated_at()', table_name);
  END LOOP;
END $$;

ALTER TABLE public.attendance_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_roster_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_registers_admin_read ON public.attendance_registers;
CREATE POLICY attendance_registers_admin_read ON public.attendance_registers
  FOR SELECT
  TO authenticated
  USING (private.is_admin());

DROP POLICY IF EXISTS attendance_registers_teacher_read ON public.attendance_registers;
CREATE POLICY attendance_registers_teacher_read ON public.attendance_registers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.courses c
      LEFT JOIN public.teacher_assignments ta ON ta.course_id = c.id AND ta.deleted_at IS NULL
      WHERE c.classroom_id = attendance_registers.classroom_id
        AND c.deleted_at IS NULL
        AND (c.teacher_id = auth.uid() OR ta.teacher_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS attendance_registers_staff_write ON public.attendance_registers;
CREATE POLICY attendance_registers_staff_write ON public.attendance_registers
  FOR ALL
  TO authenticated
  USING (
    private.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      LEFT JOIN public.teacher_assignments ta ON ta.course_id = c.id AND ta.deleted_at IS NULL
      WHERE c.classroom_id = attendance_registers.classroom_id
        AND c.deleted_at IS NULL
        AND (c.teacher_id = auth.uid() OR ta.teacher_id = auth.uid())
    )
  )
  WITH CHECK (
    private.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      LEFT JOIN public.teacher_assignments ta ON ta.course_id = c.id AND ta.deleted_at IS NULL
      WHERE c.classroom_id = attendance_registers.classroom_id
        AND c.deleted_at IS NULL
        AND (c.teacher_id = auth.uid() OR ta.teacher_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS class_roster_snapshots_admin_read ON public.class_roster_snapshots;
CREATE POLICY class_roster_snapshots_admin_read ON public.class_roster_snapshots
  FOR SELECT
  TO authenticated
  USING (private.is_admin());

DROP POLICY IF EXISTS class_roster_snapshots_teacher_read ON public.class_roster_snapshots;
CREATE POLICY class_roster_snapshots_teacher_read ON public.class_roster_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.courses c
      LEFT JOIN public.teacher_assignments ta ON ta.course_id = c.id AND ta.deleted_at IS NULL
      WHERE c.classroom_id = class_roster_snapshots.classroom_id
        AND c.deleted_at IS NULL
        AND (c.teacher_id = auth.uid() OR ta.teacher_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS class_roster_snapshots_staff_write ON public.class_roster_snapshots;
CREATE POLICY class_roster_snapshots_staff_write ON public.class_roster_snapshots
  FOR ALL
  TO authenticated
  USING (
    private.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      LEFT JOIN public.teacher_assignments ta ON ta.course_id = c.id AND ta.deleted_at IS NULL
      WHERE c.classroom_id = class_roster_snapshots.classroom_id
        AND c.deleted_at IS NULL
        AND (c.teacher_id = auth.uid() OR ta.teacher_id = auth.uid())
    )
  )
  WITH CHECK (
    private.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      LEFT JOIN public.teacher_assignments ta ON ta.course_id = c.id AND ta.deleted_at IS NULL
      WHERE c.classroom_id = class_roster_snapshots.classroom_id
        AND c.deleted_at IS NULL
        AND (c.teacher_id = auth.uid() OR ta.teacher_id = auth.uid())
    )
  );

WITH weighted_defaults AS (
  SELECT
    c.id AS course_id,
    assessment.title,
    assessment.category,
    assessment.max_score,
    assessment.weight,
    c.term
  FROM public.courses c
  CROSS JOIN (
    VALUES
      ('Class Assessment', 'continuous_assessment', 50::NUMERIC, 0.40::NUMERIC),
      ('End of Term Examination', 'exam', 100::NUMERIC, 0.60::NUMERIC)
  ) AS assessment(title, category, max_score, weight)
  WHERE c.deleted_at IS NULL
)
INSERT INTO public.grade_items (course_id, title, category, max_score, weight, status, metadata)
SELECT
  wd.course_id,
  wd.title,
  wd.category,
  wd.max_score,
  wd.weight,
  'open',
  jsonb_build_object('seeded_for_beta', true, 'term', wd.term)
FROM weighted_defaults wd
WHERE NOT EXISTS (
  SELECT 1
  FROM public.grade_items gi
  WHERE gi.course_id = wd.course_id
    AND lower(gi.title) = lower(wd.title)
    AND gi.deleted_at IS NULL
);

INSERT INTO public.fee_categories (name, code, description)
VALUES
  ('Tuition', 'TUITION', 'Core academic tuition fees'),
  ('Learning Materials', 'MATERIALS', 'Books, worksheets, and classroom learning resources'),
  ('Technology and STEM', 'TECH_STEM', 'Robotics, digital literacy, and STEM enrichment support'),
  ('Creative Arts and Music', 'ARTS_MUSIC', 'Music, arts, and creative programme support'),
  ('Uniform and Supplies', 'SUPPLIES', 'Uniform, supplies, and other issued items')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

INSERT INTO public.school_settings (key, value, description, is_public)
VALUES
  (
    'academic_assessment_policy',
    '{"terms_per_year":3,"class_score_weight":40,"exam_weight":60,"grade_scale":"A1-F9","attendance_locking":"daily_submitted_register"}'::JSONB,
    'Crestview beta academic policy for trimester attendance, grading, and reporting.',
    FALSE
  )
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();
