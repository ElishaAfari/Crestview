CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$
BEGIN
  CREATE TYPE public.risk_level AS ENUM ('green', 'amber', 'red');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.application_status AS ENUM ('submitted', 'reviewing', 'accepted', 'waitlisted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'open', 'paid', 'overdue', 'void');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'verified', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  nationality TEXT,
  address JSONB,
  emergency_contact JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
    AND p.deleted_at IS NULL
  LIMIT 1;
$$;

CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  head_id UUID REFERENCES public.profiles(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id),
  capacity INTEGER DEFAULT 30 CHECK (capacity > 0),
  room_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (name, academic_year_id)
);

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  credit_hours INTEGER DEFAULT 1 CHECK (credit_hours > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_number TEXT NOT NULL UNIQUE,
  classroom_id UUID REFERENCES public.classrooms(id),
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'withdrawn', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.parent_students (
  parent_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'guardian',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (parent_profile_id, student_id)
);

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id),
  teacher_id UUID REFERENCES public.profiles(id),
  academic_year_id UUID REFERENCES public.academic_years(id),
  term TEXT NOT NULL DEFAULT 'Term 1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (subject_id, classroom_id, academic_year_id, term)
);

CREATE TABLE public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'lead',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (teacher_id, course_id)
);

CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  max_score NUMERIC(6,2) DEFAULT 100,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  score NUMERIC(6,2),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id),
  course_id UUID REFERENCES public.courses(id),
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  recorded_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (student_id, attendance_date, course_id)
);

CREATE TABLE public.grade_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'assessment',
  max_score NUMERIC(6,2) NOT NULL DEFAULT 100,
  weight NUMERIC(5,2) NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_item_id UUID NOT NULL REFERENCES public.grade_items(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score NUMERIC(6,2) NOT NULL CHECK (score >= 0),
  comments TEXT,
  graded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (grade_item_id, student_id)
);

CREATE TABLE public.timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  starts_at TIME NOT NULL,
  ends_at TIME NOT NULL,
  room_number TEXT,
  academic_year_id UUID REFERENCES public.academic_years(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_at > starts_at)
);

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_reference TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'processing', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_on >= starts_on)
);

CREATE TABLE public.payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  staff_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(12,2) GENERATED ALWAYS AS (gross_pay - deductions) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  description TEXT NOT NULL,
  closes_on DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.admission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_first_name TEXT NOT NULL,
  applicant_last_name TEXT NOT NULL,
  applying_grade TEXT NOT NULL,
  guardian_email TEXT NOT NULL,
  guardian_phone TEXT,
  status public.application_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.conversation_members (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, profile_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id),
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (bucket, path)
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id),
  academic_year_id UUID REFERENCES public.academic_years(id),
  term TEXT NOT NULL,
  summary TEXT,
  report_url TEXT,
  generated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.ai_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id),
  term TEXT,
  risk_level public.risk_level NOT NULL DEFAULT 'green',
  strengths JSONB DEFAULT '[]'::JSONB,
  concerns JSONB DEFAULT '[]'::JSONB,
  recommendations JSONB DEFAULT '[]'::JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (profile_id, route, window_start)
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_role ON public.profiles(role_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_deleted ON public.profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_classroom ON public.students(classroom_id);
CREATE INDEX idx_attendance_student_date ON public.attendance_records(student_id, attendance_date);
CREATE INDEX idx_grades_student ON public.grades(student_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, read_at);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_admissions_search ON public.admission_applications USING GIN ((applicant_first_name || ' ' || applicant_last_name) gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_uuid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    record_uuid := NULLIF(TO_JSONB(OLD)->>'id', '')::UUID;
  ELSE
    record_uuid := NULLIF(TO_JSONB(NEW)->>'id', '')::UUID;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, before, after)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    record_uuid,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN TO_JSONB(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN TO_JSONB(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'roles', 'permissions', 'role_permissions', 'profiles', 'academic_years',
    'departments', 'classrooms', 'subjects', 'students', 'parent_students',
    'courses', 'teacher_assignments', 'assignments', 'assignment_submissions',
    'attendance_records', 'grade_items', 'grades', 'timetables', 'invoices',
    'payments', 'payroll_periods', 'payroll_items', 'job_postings',
    'admission_applications', 'conversations', 'conversation_members',
    'messages', 'notifications', 'files', 'reports', 'ai_analytics',
    'ai_rate_limits', 'audit_logs'
  ]
  LOOP
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', table_name, table_name);
    EXECUTE FORMAT('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'roles', 'permissions', 'role_permissions', 'profiles', 'academic_years',
    'departments', 'classrooms', 'subjects', 'students', 'parent_students',
    'courses', 'teacher_assignments', 'assignments', 'assignment_submissions',
    'attendance_records', 'grade_items', 'grades', 'timetables', 'invoices',
    'payments', 'payroll_periods', 'payroll_items', 'job_postings',
    'admission_applications', 'conversations', 'conversation_members',
    'messages', 'notifications', 'files', 'reports', 'ai_analytics',
    'ai_rate_limits'
  ]
  LOOP
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_audit ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.write_audit_log()', table_name, table_name);
  END LOOP;
END $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'roles', 'permissions', 'role_permissions', 'academic_years', 'departments', 'classrooms',
    'subjects', 'courses', 'job_postings'
  ]
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_authenticated_read ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_authenticated_read ON public.%I FOR SELECT TO authenticated USING (deleted_at IS NULL)', table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_admin_write ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_admin_write ON public.%I FOR ALL TO authenticated USING (public.current_profile_role() IN (''super_admin'', ''school_admin'')) WITH CHECK (public.current_profile_role() IN (''super_admin'', ''school_admin''))', table_name, table_name);
  END LOOP;
END $$;

CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff'));

CREATE POLICY profiles_admin_write ON public.profiles
  FOR ALL TO authenticated
  USING (public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff'))
  WITH CHECK (public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff'));

CREATE POLICY students_role_read ON public.students
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.current_profile_role() IN ('super_admin', 'school_admin', 'teacher')
      OR profile_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.parent_students ps
        WHERE ps.student_id = students.id
          AND ps.parent_profile_id = auth.uid()
          AND ps.deleted_at IS NULL
      )
    )
  );

CREATE POLICY students_admin_write ON public.students
  FOR ALL TO authenticated
  USING (public.current_profile_role() IN ('super_admin', 'school_admin'))
  WITH CHECK (public.current_profile_role() IN ('super_admin', 'school_admin'));

CREATE POLICY parent_students_member_read ON public.parent_students
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      parent_profile_id = auth.uid()
      OR public.current_profile_role() IN ('super_admin', 'school_admin', 'teacher')
    )
  );

CREATE POLICY parent_students_admin_write ON public.parent_students
  FOR ALL TO authenticated
  USING (public.current_profile_role() IN ('super_admin', 'school_admin'))
  WITH CHECK (public.current_profile_role() IN ('super_admin', 'school_admin'));

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'teacher_assignments', 'assignments', 'assignment_submissions',
    'attendance_records', 'grade_items', 'grades', 'timetables', 'reports',
    'ai_analytics'
  ]
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_academic_read ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_academic_read ON public.%I FOR SELECT TO authenticated USING (deleted_at IS NULL)', table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_staff_write ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_staff_write ON public.%I FOR ALL TO authenticated USING (public.current_profile_role() IN (''super_admin'', ''school_admin'', ''teacher'')) WITH CHECK (public.current_profile_role() IN (''super_admin'', ''school_admin'', ''teacher''))', table_name, table_name);
  END LOOP;
END $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['invoices', 'payments']
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_finance_read ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_finance_read ON public.%I FOR SELECT TO authenticated USING (deleted_at IS NULL AND public.current_profile_role() IN (''super_admin'', ''school_admin'', ''finance_officer'', ''parent''))', table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_finance_write ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_finance_write ON public.%I FOR ALL TO authenticated USING (public.current_profile_role() IN (''super_admin'', ''school_admin'', ''finance_officer'')) WITH CHECK (public.current_profile_role() IN (''super_admin'', ''school_admin'', ''finance_officer''))', table_name, table_name);
  END LOOP;
END $$;

CREATE POLICY payroll_hr_read ON public.payroll_periods
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff', 'finance_officer'));

CREATE POLICY payroll_hr_write ON public.payroll_periods
  FOR ALL TO authenticated
  USING (public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff', 'finance_officer'))
  WITH CHECK (public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff', 'finance_officer'));

CREATE POLICY payroll_items_hr_read ON public.payroll_items
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff', 'finance_officer'));

CREATE POLICY payroll_items_hr_write ON public.payroll_items
  FOR ALL TO authenticated
  USING (public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff', 'finance_officer'))
  WITH CHECK (public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff', 'finance_officer'));

CREATE POLICY admissions_public_insert ON public.admission_applications
  FOR INSERT TO anon
  WITH CHECK (TRUE);

CREATE POLICY admissions_staff_manage ON public.admission_applications
  FOR ALL TO authenticated
  USING (public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff'))
  WITH CHECK (public.current_profile_role() IN ('super_admin', 'school_admin', 'hr_staff'));

CREATE POLICY conversations_member_read ON public.conversations
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversations.id
        AND cm.profile_id = auth.uid()
        AND cm.deleted_at IS NULL
    )
  );

CREATE POLICY conversations_member_write ON public.conversations
  FOR ALL TO authenticated
  USING (created_by = auth.uid() OR public.current_profile_role() IN ('super_admin', 'school_admin'))
  WITH CHECK (created_by = auth.uid() OR public.current_profile_role() IN ('super_admin', 'school_admin'));

CREATE POLICY conversation_members_member_read ON public.conversation_members
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      profile_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.conversation_members self
        WHERE self.conversation_id = conversation_members.conversation_id
          AND self.profile_id = auth.uid()
          AND self.deleted_at IS NULL
      )
    )
  );

CREATE POLICY conversation_members_owner_write ON public.conversation_members
  FOR ALL TO authenticated
  USING (public.current_profile_role() IN ('super_admin', 'school_admin') OR profile_id = auth.uid())
  WITH CHECK (public.current_profile_role() IN ('super_admin', 'school_admin') OR profile_id = auth.uid());

CREATE POLICY messages_member_read ON public.messages
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id
        AND cm.profile_id = auth.uid()
        AND cm.deleted_at IS NULL
    )
  );

CREATE POLICY messages_member_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id
        AND cm.profile_id = auth.uid()
        AND cm.deleted_at IS NULL
    )
  );

CREATE POLICY notifications_recipient_read ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY notifications_recipient_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY notifications_staff_insert ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.current_profile_role() IN ('super_admin', 'school_admin', 'teacher', 'finance_officer', 'hr_staff'));

CREATE POLICY files_owner_read ON public.files
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.current_profile_role() IN ('super_admin', 'school_admin'));

CREATE POLICY files_owner_write ON public.files
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.current_profile_role() IN ('super_admin', 'school_admin'))
  WITH CHECK (owner_id = auth.uid() OR public.current_profile_role() IN ('super_admin', 'school_admin'));

CREATE POLICY ai_rate_limits_self ON public.ai_rate_limits
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY audit_admin_read ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.current_profile_role() IN ('super_admin', 'school_admin'));
