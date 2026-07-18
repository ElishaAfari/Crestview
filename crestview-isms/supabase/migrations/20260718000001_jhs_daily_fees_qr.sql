DO $$
DECLARE
  ay_id UUID;
  class_row RECORD;
  subject_code TEXT;
  term_name TEXT;
BEGIN
  SELECT id INTO ay_id
  FROM public.academic_years
  WHERE is_current = TRUE
    AND deleted_at IS NULL
  ORDER BY start_date DESC
  LIMIT 1;

  IF ay_id IS NULL THEN
    INSERT INTO public.academic_years (name, start_date, end_date, is_current)
    VALUES ('2025/2026', '2025-09-01', '2026-07-15', TRUE)
    ON CONFLICT (name) DO UPDATE
      SET is_current = TRUE,
          deleted_at = NULL
    RETURNING id INTO ay_id;
  END IF;

  INSERT INTO public.departments (name, code, description) VALUES
    ('Junior High School', 'JHS', 'Junior high curriculum for JHS 1, JHS 2, and JHS 3.'),
    ('Science and Technology', 'SCI', 'Integrated science, computing, robotics, STEM, and applied technology.'),
    ('Career Technology', 'CTE', 'Agriculture, home economics, technical design, and practical life skills.'),
    ('Creative Arts and Design', 'CAD', 'Creative expression, music, design, culture, and visual arts.')
  ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        deleted_at = NULL;

  INSERT INTO public.subjects (name, code, department_id, credit_hours) VALUES
    ('English Language', 'JHS-ENG', (SELECT id FROM public.departments WHERE code = 'LAN'), 1),
    ('Mathematics', 'JHS-MAT', (SELECT id FROM public.departments WHERE code = 'MTH'), 1),
    ('Integrated Science', 'JHS-SCI', (SELECT id FROM public.departments WHERE code = 'SCI'), 1),
    ('Social Studies', 'JHS-SOS', (SELECT id FROM public.departments WHERE code = 'SOC'), 1),
    ('Computing / ICT', 'JHS-ICT', (SELECT id FROM public.departments WHERE code = 'SCI'), 1),
    ('Religious and Moral Education (RME)', 'JHS-RME', (SELECT id FROM public.departments WHERE code = 'RME'), 1),
    ('Career Technology', 'JHS-CTE', (SELECT id FROM public.departments WHERE code = 'CTE'), 1),
    ('Creative Arts and Design', 'JHS-CAD', (SELECT id FROM public.departments WHERE code = 'CAD'), 1),
    ('Ghanaian Language and Culture', 'JHS-GLC', (SELECT id FROM public.departments WHERE code = 'GHA'), 1),
    ('French', 'JHS-FRE', (SELECT id FROM public.departments WHERE code = 'LAN'), 1)
  ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name,
        department_id = EXCLUDED.department_id,
        credit_hours = EXCLUDED.credit_hours,
        deleted_at = NULL;

  FOR class_row IN
    SELECT *
    FROM (
      VALUES
        ('JHS 1', 'Junior High 1', 'JHS-1', ARRAY['JHS-ENG','JHS-MAT','JHS-SCI','JHS-SOS','JHS-ICT','JHS-RME','JHS-CTE','JHS-CAD','JHS-GLC','JHS-FRE']::TEXT[]),
        ('JHS 2', 'Junior High 2', 'JHS-2', ARRAY['JHS-ENG','JHS-MAT','JHS-SCI','JHS-SOS','JHS-ICT','JHS-RME','JHS-CTE','JHS-CAD','JHS-GLC','JHS-FRE']::TEXT[]),
        ('JHS 3', 'Junior High 3', 'JHS-3', ARRAY['JHS-ENG','JHS-MAT','JHS-SCI','JHS-SOS','JHS-ICT','JHS-RME','JHS-CTE','JHS-CAD','JHS-GLC','JHS-FRE']::TEXT[])
    ) AS classes(name, grade_level, room_number, subject_codes)
  LOOP
    INSERT INTO public.classrooms (name, grade_level, academic_year_id, capacity, room_number)
    VALUES (class_row.name, class_row.grade_level, ay_id, 35, class_row.room_number)
    ON CONFLICT (name, academic_year_id) DO UPDATE
      SET grade_level = EXCLUDED.grade_level,
          room_number = EXCLUDED.room_number,
          capacity = EXCLUDED.capacity,
          deleted_at = NULL;

    FOREACH term_name IN ARRAY ARRAY['Term 1', 'Term 2', 'Term 3']::TEXT[] LOOP
      FOREACH subject_code IN ARRAY class_row.subject_codes LOOP
        INSERT INTO public.courses (subject_id, classroom_id, academic_year_id, term)
        VALUES (
          (SELECT id FROM public.subjects WHERE code = subject_code),
          (SELECT id FROM public.classrooms WHERE name = class_row.name AND academic_year_id = ay_id),
          ay_id,
          term_name
        )
        ON CONFLICT (subject_id, classroom_id, academic_year_id, term) DO UPDATE
          SET deleted_at = NULL;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.student_qr_payload(student_number TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 'CIS-STUDENT:' || UPPER(TRIM(student_number));
$$;

CREATE TABLE IF NOT EXISTS public.daily_fee_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Daily attendance fee',
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'GHS',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_daily_fee_plans_classroom_active
  ON public.daily_fee_plans(classroom_id, academic_year_id, is_active, effective_from DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.daily_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  fee_plan_id UUID REFERENCES public.daily_fee_plans(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  student_number TEXT NOT NULL,
  qr_payload TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'GHS',
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'mobile_money', 'card', 'bank', 'other')),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'waived', 'reversed')),
  reference TEXT NOT NULL UNIQUE,
  recorded_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_fee_payments_one_active_per_student_day_idx
  ON public.daily_fee_payments(student_id, payment_date)
  WHERE deleted_at IS NULL
    AND status IN ('paid', 'waived');

CREATE INDEX IF NOT EXISTS idx_daily_fee_payments_date_class
  ON public.daily_fee_payments(payment_date DESC, classroom_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_daily_fee_payments_student
  ON public.daily_fee_payments(student_id, payment_date DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.student_id_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL UNIQUE,
  student_number TEXT NOT NULL,
  qr_payload TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'lost', 'reissued', 'retired')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_on DATE,
  issued_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS student_id_cards_one_active_card_idx
  ON public.student_id_cards(student_id)
  WHERE status = 'active'
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_student_id_cards_student_number
  ON public.student_id_cards(student_number)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION private.ensure_active_student_id_card()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  normalized_student_number TEXT;
  payload TEXT;
BEGIN
  IF NEW.student_number IS NULL OR TRIM(NEW.student_number) = '' THEN
    RETURN NEW;
  END IF;

  normalized_student_number := UPPER(TRIM(NEW.student_number));
  payload := public.student_qr_payload(normalized_student_number);

  IF TG_OP = 'UPDATE' AND COALESCE(OLD.student_number, '') <> NEW.student_number THEN
    UPDATE public.student_id_cards
    SET status = 'reissued',
        deleted_at = COALESCE(deleted_at, NOW()),
        updated_at = NOW()
    WHERE student_id = NEW.id
      AND status = 'active'
      AND deleted_at IS NULL;
  END IF;

  INSERT INTO public.student_id_cards (student_id, card_number, student_number, qr_payload, status, metadata)
  VALUES (
    NEW.id,
    'CARD-' || REGEXP_REPLACE(normalized_student_number, '[^A-Z0-9]+', '', 'g'),
    normalized_student_number,
    payload,
    'active',
    jsonb_build_object('source', 'student_record_trigger')
  )
  ON CONFLICT (qr_payload) DO UPDATE
    SET student_id = EXCLUDED.student_id,
        card_number = EXCLUDED.card_number,
        student_number = EXCLUDED.student_number,
        status = 'active',
        deleted_at = NULL,
        updated_at = NOW(),
        metadata = public.student_id_cards.metadata || EXCLUDED.metadata;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_students_ensure_id_card ON public.students;
CREATE TRIGGER trg_students_ensure_id_card
AFTER INSERT OR UPDATE OF student_number
ON public.students
FOR EACH ROW
EXECUTE FUNCTION private.ensure_active_student_id_card();

INSERT INTO public.student_id_cards (student_id, card_number, student_number, qr_payload, status, metadata)
SELECT
  s.id,
  'CARD-' || REGEXP_REPLACE(UPPER(TRIM(s.student_number)), '[^A-Z0-9]+', '', 'g'),
  UPPER(TRIM(s.student_number)),
  public.student_qr_payload(s.student_number),
  'active',
  '{"source":"migration_backfill"}'::JSONB
FROM public.students s
WHERE s.deleted_at IS NULL
  AND s.student_number IS NOT NULL
ON CONFLICT (qr_payload) DO UPDATE
  SET student_id = EXCLUDED.student_id,
      card_number = EXCLUDED.card_number,
      student_number = EXCLUDED.student_number,
      status = 'active',
      deleted_at = NULL,
      updated_at = NOW(),
      metadata = public.student_id_cards.metadata || EXCLUDED.metadata;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['daily_fee_plans', 'daily_fee_payments', 'student_id_cards']
  LOOP
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.set_updated_at()', table_name, table_name);
  END LOOP;
END $$;

ALTER TABLE public.daily_fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_id_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_fee_plans_authenticated_read ON public.daily_fee_plans;
CREATE POLICY daily_fee_plans_authenticated_read ON public.daily_fee_plans
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS daily_fee_plans_finance_manage ON public.daily_fee_plans;
CREATE POLICY daily_fee_plans_finance_manage ON public.daily_fee_plans
  FOR ALL
  TO authenticated
  USING (private.is_finance_staff())
  WITH CHECK (private.is_finance_staff());

DROP POLICY IF EXISTS daily_fee_payments_member_read ON public.daily_fee_payments;
CREATE POLICY daily_fee_payments_member_read ON public.daily_fee_payments
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND (private.is_finance_staff() OR private.can_access_student(student_id)));

DROP POLICY IF EXISTS daily_fee_payments_finance_manage ON public.daily_fee_payments;
CREATE POLICY daily_fee_payments_finance_manage ON public.daily_fee_payments
  FOR ALL
  TO authenticated
  USING (private.is_finance_staff())
  WITH CHECK (private.is_finance_staff());

DROP POLICY IF EXISTS student_id_cards_member_read ON public.student_id_cards;
CREATE POLICY student_id_cards_member_read ON public.student_id_cards
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_finance_staff()
      OR private.is_academic_staff()
      OR private.can_access_student(student_id)
    )
  );

DROP POLICY IF EXISTS student_id_cards_admin_manage ON public.student_id_cards;
CREATE POLICY student_id_cards_admin_manage ON public.student_id_cards
  FOR ALL
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
