ALTER TABLE public.admission_applications
  ADD COLUMN IF NOT EXISTS accepted_student_id UUID REFERENCES public.students(id),
  ADD COLUMN IF NOT EXISTS parent_profile_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS generated_student_number TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_notes TEXT;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'School fees',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES public.classrooms(id),
  ADD COLUMN IF NOT EXISTS issued_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE TABLE IF NOT EXISTS public.billing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  classroom_id UUID REFERENCES public.classrooms(id),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'GHS',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'void')),
  created_by UUID REFERENCES public.profiles(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS billing_batch_id UUID REFERENCES public.billing_batches(id);

CREATE INDEX IF NOT EXISTS idx_invoices_parent_batch ON public.invoices(billing_batch_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_classroom_status ON public.invoices(classroom_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_billing_batches_classroom_status ON public.billing_batches(classroom_id, status) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.grading_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  min_percentage NUMERIC(6,2) NOT NULL CHECK (min_percentage >= 0),
  max_percentage NUMERIC(6,2) NOT NULL CHECK (max_percentage <= 100),
  remark TEXT NOT NULL,
  points NUMERIC(4,2),
  is_passing BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (max_percentage >= min_percentage)
);

INSERT INTO public.grading_scales (code, label, min_percentage, max_percentage, remark, points, is_passing, sort_order, metadata)
VALUES
  ('A1', 'A1', 75, 100, 'Excellent', 1.00, TRUE, 1, '{"system":"waec_ges_aligned_default"}'),
  ('B2', 'B2', 70, 74.99, 'Very good', 2.00, TRUE, 2, '{"system":"waec_ges_aligned_default"}'),
  ('B3', 'B3', 65, 69.99, 'Good', 3.00, TRUE, 3, '{"system":"waec_ges_aligned_default"}'),
  ('C4', 'C4', 60, 64.99, 'Credit', 4.00, TRUE, 4, '{"system":"waec_ges_aligned_default"}'),
  ('C5', 'C5', 55, 59.99, 'Credit', 5.00, TRUE, 5, '{"system":"waec_ges_aligned_default"}'),
  ('C6', 'C6', 50, 54.99, 'Credit', 6.00, TRUE, 6, '{"system":"waec_ges_aligned_default"}'),
  ('D7', 'D7', 45, 49.99, 'Pass', 7.00, TRUE, 7, '{"system":"waec_ges_aligned_default"}'),
  ('E8', 'E8', 40, 44.99, 'Pass', 8.00, TRUE, 8, '{"system":"waec_ges_aligned_default"}'),
  ('F9', 'F9', 0, 39.99, 'Fail', 9.00, FALSE, 9, '{"system":"waec_ges_aligned_default"}')
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label,
    min_percentage = EXCLUDED.min_percentage,
    max_percentage = EXCLUDED.max_percentage,
    remark = EXCLUDED.remark,
    points = EXCLUDED.points,
    is_passing = EXCLUDED.is_passing,
    sort_order = EXCLUDED.sort_order,
    metadata = public.grading_scales.metadata || EXCLUDED.metadata,
    deleted_at = NULL;

ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS percentage NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS grade_code TEXT,
  ADD COLUMN IF NOT EXISTS grade_points NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS remark TEXT,
  ADD COLUMN IF NOT EXISTS scale_id UUID REFERENCES public.grading_scales(id);

CREATE INDEX IF NOT EXISTS idx_grades_student_grade_code ON public.grades(student_id, grade_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_grades_scale_id ON public.grades(scale_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.grade_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  grade_item_id UUID REFERENCES public.grade_items(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES public.profiles(id),
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('draft', 'processed', 'failed')),
  rows_total INTEGER NOT NULL DEFAULT 0 CHECK (rows_total >= 0),
  rows_success INTEGER NOT NULL DEFAULT 0 CHECK (rows_success >= 0),
  rows_failed INTEGER NOT NULL DEFAULT 0 CHECK (rows_failed >= 0),
  error_summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_grade_import_batches_course ON public.grade_import_batches(course_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_grade_import_batches_uploader ON public.grade_import_batches(uploaded_by, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.staff_class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id),
  assignment_type TEXT NOT NULL DEFAULT 'class_teacher' CHECK (assignment_type IN ('class_teacher', 'subject_teacher', 'assistant', 'support')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  assigned_by UUID REFERENCES public.profiles(id),
  starts_on DATE DEFAULT CURRENT_DATE,
  ends_on DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (profile_id, classroom_id, academic_year_id, assignment_type)
);

CREATE INDEX IF NOT EXISTS idx_staff_class_assignments_profile ON public.staff_class_assignments(profile_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_class_assignments_classroom ON public.staff_class_assignments(classroom_id, status) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.class_promotion_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  from_classroom_id UUID NOT NULL REFERENCES public.classrooms(id),
  to_classroom_id UUID NOT NULL REFERENCES public.classrooms(id),
  academic_year_id UUID REFERENCES public.academic_years(id),
  promoted_by UUID REFERENCES public.profiles(id),
  promoted_on DATE NOT NULL DEFAULT CURRENT_DATE,
  student_count INTEGER NOT NULL DEFAULT 0 CHECK (student_count >= 0),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (from_classroom_id <> to_classroom_id)
);

CREATE TABLE IF NOT EXISTS public.student_promotion_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_batch_id UUID NOT NULL REFERENCES public.class_promotion_batches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  from_classroom_id UUID NOT NULL REFERENCES public.classrooms(id),
  to_classroom_id UUID NOT NULL REFERENCES public.classrooms(id),
  previous_status TEXT,
  promoted_by UUID REFERENCES public.profiles(id),
  promoted_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (promotion_batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_promotion_records_student ON public.student_promotion_records(student_id, promoted_on DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.account_lifecycle_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  staff_profile_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'activated', 'role_changed', 'archived', 'withdrawn', 'promoted', 'graduated', 'reinstated', 'password_issued')),
  reason TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_account_lifecycle_profile ON public.account_lifecycle_records(profile_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_account_lifecycle_student ON public.account_lifecycle_records(student_id, created_at DESC) WHERE deleted_at IS NULL;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['billing_batches', 'grading_scales', 'grade_import_batches', 'staff_class_assignments', 'class_promotion_batches', 'student_promotion_records', 'account_lifecycle_records']
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = FORMAT('trg_%s_updated_at', table_name)
    ) THEN
      EXECUTE FORMAT('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.set_updated_at()', table_name, table_name);
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.billing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_promotion_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_promotion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lifecycle_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_batches_admin_finance_manage ON public.billing_batches;
CREATE POLICY billing_batches_admin_finance_manage ON public.billing_batches
  FOR ALL TO authenticated
  USING (private.is_finance_staff())
  WITH CHECK (private.is_finance_staff());

DROP POLICY IF EXISTS grading_scales_authenticated_read ON public.grading_scales;
CREATE POLICY grading_scales_authenticated_read ON public.grading_scales
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND is_active = TRUE);

DROP POLICY IF EXISTS grading_scales_admin_manage ON public.grading_scales;
CREATE POLICY grading_scales_admin_manage ON public.grading_scales
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS grade_import_batches_admin_teacher_read ON public.grade_import_batches;
CREATE POLICY grade_import_batches_admin_teacher_read ON public.grade_import_batches
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (private.is_admin() OR uploaded_by = auth.uid()));

DROP POLICY IF EXISTS staff_class_assignments_admin_teacher_read ON public.staff_class_assignments;
CREATE POLICY staff_class_assignments_admin_teacher_read ON public.staff_class_assignments
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (private.is_admin() OR profile_id = auth.uid()));

DROP POLICY IF EXISTS staff_class_assignments_admin_manage ON public.staff_class_assignments;
CREATE POLICY staff_class_assignments_admin_manage ON public.staff_class_assignments
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS class_promotion_batches_admin_manage ON public.class_promotion_batches;
CREATE POLICY class_promotion_batches_admin_manage ON public.class_promotion_batches
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS student_promotion_records_admin_read ON public.student_promotion_records;
CREATE POLICY student_promotion_records_admin_read ON public.student_promotion_records
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND private.is_admin());

DROP POLICY IF EXISTS account_lifecycle_records_admin_read ON public.account_lifecycle_records;
CREATE POLICY account_lifecycle_records_admin_read ON public.account_lifecycle_records
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND private.is_admin());
