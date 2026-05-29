-- Crestview International School ISMS completion migration.
-- Adds operational tables and Supabase Storage buckets/policies on top of the base schema.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$
BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.event_status AS ENUM ('scheduled', 'postponed', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.document_status AS ENUM ('pending', 'verified', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.leave_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.job_application_status AS ENUM ('submitted', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(role_names TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_profile_role() = ANY(role_names), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(ARRAY['super_admin', 'school_admin']);
$$;

CREATE OR REPLACE FUNCTION public.is_academic_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(ARRAY['super_admin', 'school_admin', 'teacher']);
$$;

CREATE OR REPLACE FUNCTION public.is_finance_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer']);
$$;

CREATE OR REPLACE FUNCTION public.is_hr_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(ARRAY['super_admin', 'school_admin', 'hr_staff']);
$$;

CREATE OR REPLACE FUNCTION public.can_access_student(student_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.is_admin()
    OR public.has_role(ARRAY['teacher'])
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = student_uuid
        AND s.profile_id = auth.uid()
        AND s.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1
      FROM public.parent_students ps
      WHERE ps.student_id = student_uuid
        AND ps.parent_profile_id = auth.uid()
        AND ps.deleted_at IS NULL
    ),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_profile(profile_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    profile_uuid = auth.uid()
    OR public.is_admin()
    OR public.is_hr_staff(),
    FALSE
  );
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_name TEXT,
  ADD COLUMN IF NOT EXISTS pronouns TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Accra',
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS admission_application_id UUID REFERENCES public.admission_applications(id),
  ADD COLUMN IF NOT EXISTS house TEXT,
  ADD COLUMN IF NOT EXISTS boarding_status TEXT CHECK (boarding_status IN ('day', 'boarding', 'hybrid')),
  ADD COLUMN IF NOT EXISTS previous_school TEXT,
  ADD COLUMN IF NOT EXISTS graduation_date DATE,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

ALTER TABLE public.admission_applications
  ADD COLUMN IF NOT EXISTS applicant_middle_name TEXT,
  ADD COLUMN IF NOT EXISTS applicant_date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS applicant_gender TEXT CHECK (applicant_gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id),
  ADD COLUMN IF NOT EXISTS previous_school TEXT,
  ADD COLUMN IF NOT EXISTS applicant_address JSONB,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS decision_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS original_name TEXT,
  ADD COLUMN IF NOT EXISTS storage_object_id UUID,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'school', 'public')),
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS checksum TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::JSONB,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_on >= starts_on),
  UNIQUE (academic_year_id, name)
);

CREATE TABLE IF NOT EXISTS public.school_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID REFERENCES public.academic_years(id),
  term_id UUID REFERENCES public.terms(id),
  school_date DATE NOT NULL UNIQUE,
  day_type TEXT NOT NULL DEFAULT 'instructional' CHECK (day_type IN ('instructional', 'holiday', 'exam', 'event', 'closure')),
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (bucket, path)
);

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  media_asset_id UUID REFERENCES public.media_assets(id),
  image_url TEXT,
  cta_label TEXT,
  cta_href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_media_id UUID REFERENCES public.media_assets(id),
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES public.profiles(id),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  status public.event_status NOT NULL DEFAULT 'scheduled',
  audience TEXT[] DEFAULT ARRAY['public']::TEXT[],
  cover_media_id UUID REFERENCES public.media_assets(id),
  created_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'open', 'closed', 'spam')),
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  audience_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (announcement_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.admission_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  occupation TEXT,
  address JSONB,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.admission_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id),
  document_type TEXT NOT NULL,
  status public.document_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.admission_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  interviewer_id UUID REFERENCES public.profiles(id),
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('pending', 'passed', 'needs_review', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.admission_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  from_status public.application_status,
  to_status public.application_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.admission_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  score NUMERIC(6,2),
  max_score NUMERIC(6,2) DEFAULT 100,
  assessed_by UUID REFERENCES public.profiles(id),
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (score IS NULL OR score >= 0),
  CHECK (max_score > 0)
);

CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_number TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  job_title TEXT,
  employment_type TEXT NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  hire_date DATE,
  contract_end_date DATE,
  qualification_summary TEXT,
  tax_id TEXT,
  bank_details JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id),
  document_type TEXT NOT NULL,
  status public.document_status NOT NULL DEFAULT 'pending',
  expires_on DATE,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.staff_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave', 'remote')),
  clock_in_at TIMESTAMPTZ,
  clock_out_at TIMESTAMPTZ,
  recorded_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (staff_profile_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  reason TEXT,
  status public.leave_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id),
  academic_year_id UUID REFERENCES public.academic_years(id),
  enrolled_on DATE NOT NULL DEFAULT CURRENT_DATE,
  exited_on DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'promoted', 'repeated', 'transferred', 'withdrawn', 'graduated')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (exited_on IS NULL OR exited_on >= enrolled_on)
);

CREATE TABLE IF NOT EXISTS public.student_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  blood_type TEXT,
  allergies TEXT,
  medical_conditions TEXT,
  medications TEXT,
  physician_name TEXT,
  physician_phone TEXT,
  insurance_details JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (student_id)
);

CREATE TABLE IF NOT EXISTS public.student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id),
  document_type TEXT NOT NULL,
  status public.document_status NOT NULL DEFAULT 'pending',
  expires_on DATE,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.student_behavior_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('positive', 'disciplinary', 'wellbeing', 'safeguarding')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_taken TEXT,
  visibility TEXT NOT NULL DEFAULT 'staff' CHECK (visibility IN ('staff', 'guardian', 'restricted')),
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.curriculum_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id),
  grade_level TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sequence INTEGER NOT NULL DEFAULT 0,
  learning_outcomes TEXT[] DEFAULT ARRAY[]::TEXT[],
  resources JSONB DEFAULT '[]'::JSONB,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  curriculum_unit_id UUID REFERENCES public.curriculum_units(id),
  title TEXT NOT NULL,
  objectives TEXT[] DEFAULT ARRAY[]::TEXT[],
  activities TEXT,
  homework TEXT,
  planned_for DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'taught', 'archived')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.lesson_plan_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id UUID NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id),
  title TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_id UUID REFERENCES public.files(id),
  url TEXT,
  visible_from TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.assignment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.submission_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id),
  grade_item_id UUID REFERENCES public.grade_items(id),
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  invigilator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS public.fee_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.fee_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id),
  grade_level TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (name, academic_year_id, grade_level)
);

CREATE TABLE IF NOT EXISTS public.fee_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_plan_id UUID NOT NULL REFERENCES public.fee_plans(id) ON DELETE CASCADE,
  fee_category_id UUID REFERENCES public.fee_categories(id),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  due_offset_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  fee_category_id UUID REFERENCES public.fee_categories(id),
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount NUMERIC(12,2) NOT NULL CHECK (unit_amount >= 0),
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_amount) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  invoice_item_id UUID REFERENCES public.invoice_items(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  value NUMERIC(12,2) NOT NULL CHECK (value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.student_scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  starts_on DATE NOT NULL,
  ends_on DATE,
  approved_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  vendor TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'paid', 'void')),
  file_id UUID REFERENCES public.files(id),
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_event_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cover_letter TEXT,
  status public.job_application_status NOT NULL DEFAULT 'submitted',
  assigned_to UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.job_application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id),
  document_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.job_application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  from_status public.job_application_status,
  to_status public.job_application_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
  notification_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (profile_id, channel, notification_type)
);

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_profile_id UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  provider TEXT,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.sms_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone TEXT NOT NULL,
  recipient_profile_id UUID REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn TEXT,
  title TEXT NOT NULL,
  subtitle TEXT,
  authors TEXT[] DEFAULT ARRAY[]::TEXT[],
  publisher TEXT,
  published_year INTEGER,
  category TEXT,
  cover_media_id UUID REFERENCES public.media_assets(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.library_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL UNIQUE,
  shelf_location TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'loaned', 'lost', 'damaged', 'reserved')),
  acquired_on DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.library_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copy_id UUID NOT NULL REFERENCES public.library_copies(id) ON DELETE CASCADE,
  borrower_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  loaned_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  issued_by UUID REFERENCES public.profiles(id),
  received_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.library_fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.library_loans(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'waived', 'void')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.transport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  driver_profile_id UUID REFERENCES public.profiles(id),
  vehicle_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.transport_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  pickup_time TIME,
  dropoff_time TIME,
  sequence INTEGER NOT NULL DEFAULT 0,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.student_transport_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.transport_routes(id),
  pickup_stop_id UUID REFERENCES public.transport_stops(id),
  dropoff_stop_id UUID REFERENCES public.transport_stops(id),
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  serial_number TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'repair', 'retired', 'lost')),
  purchased_on DATE,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  requester_id UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'normal',
  category TEXT,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  file_id UUID REFERENCES public.files(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ai_tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT,
  model TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ai_tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_tutor_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  token_count INTEGER CHECK (token_count IS NULL OR token_count >= 0),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id),
  route TEXT NOT NULL,
  model TEXT,
  prompt_tokens INTEGER DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER DEFAULT 0 CHECK (completion_tokens >= 0),
  cost_cents NUMERIC(12,4) DEFAULT 0 CHECK (cost_cents >= 0),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.system_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  payload JSONB DEFAULT '{}'::JSONB,
  result JSONB,
  attempts INTEGER NOT NULL DEFAULT 0,
  run_after TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_id TEXT,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_terms_year ON public.terms(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_school_days_date ON public.school_days(school_date);
CREATE INDEX IF NOT EXISTS idx_media_assets_bucket_path ON public.media_assets(bucket, path);
CREATE INDEX IF NOT EXISTS idx_news_posts_status_published ON public.news_posts(status, published_at);
CREATE INDEX IF NOT EXISTS idx_news_posts_search ON public.news_posts USING GIN ((title || ' ' || COALESCE(excerpt, '') || ' ' || body) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events(starts_at);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status, created_at);
CREATE INDEX IF NOT EXISTS idx_admission_guardians_application ON public.admission_guardians(application_id);
CREATE INDEX IF NOT EXISTS idx_admission_documents_application ON public.admission_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_profile ON public.staff_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON public.student_enrollments(student_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_student ON public.student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_course_date ON public.lesson_plans(course_id, planned_for);
CREATE INDEX IF NOT EXISTS idx_course_materials_course ON public.course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status_date ON public.expenses(status, expense_date);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_library_loans_borrower ON public.library_loans(borrower_profile_id, returned_at);
CREATE INDEX IF NOT EXISTS idx_transport_assignments_student ON public.student_transport_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_profile ON public.ai_tutor_sessions(profile_id, created_at);
CREATE INDEX IF NOT EXISTS idx_system_jobs_status ON public.system_jobs(status, run_after);
CREATE INDEX IF NOT EXISTS idx_files_entity ON public.files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'school_settings', 'terms', 'school_days', 'media_assets', 'hero_slides',
    'news_posts', 'events', 'contact_inquiries', 'announcements',
    'announcement_reads', 'admission_guardians', 'admission_documents',
    'admission_interviews', 'admission_status_history', 'admission_assessments',
    'staff_profiles', 'staff_documents', 'staff_attendance_records',
    'leave_requests', 'student_enrollments', 'student_medical_records',
    'student_documents', 'student_behavior_records', 'curriculum_units',
    'lesson_plans', 'lesson_plan_resources', 'course_materials',
    'assignment_attachments', 'submission_attachments', 'exam_sessions',
    'fee_categories', 'fee_plans', 'fee_plan_items', 'invoice_items',
    'payment_allocations', 'scholarships', 'student_scholarships',
    'expenses', 'payment_webhook_events', 'job_applications',
    'job_application_documents', 'job_application_status_history',
    'message_attachments', 'notification_preferences', 'email_outbox',
    'sms_outbox', 'push_subscriptions', 'library_books', 'library_copies',
    'library_loans', 'library_fines', 'transport_routes', 'transport_stops',
    'student_transport_assignments', 'devices', 'support_tickets',
    'support_ticket_comments', 'ai_tutor_sessions', 'ai_tutor_messages',
    'ai_usage_logs', 'system_jobs', 'integration_events'
  ]
  LOOP
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', table_name, table_name);
    EXECUTE FORMAT('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_audit ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.write_audit_log()', table_name, table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS school_settings_public_read ON public.school_settings;
CREATE POLICY school_settings_public_read ON public.school_settings
  FOR SELECT TO anon, authenticated
  USING (is_public = TRUE AND deleted_at IS NULL);

DROP POLICY IF EXISTS school_settings_admin_manage ON public.school_settings;
CREATE POLICY school_settings_admin_manage ON public.school_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS media_assets_public_read ON public.media_assets;
CREATE POLICY media_assets_public_read ON public.media_assets
  FOR SELECT TO anon, authenticated
  USING (is_public = TRUE AND deleted_at IS NULL);

DROP POLICY IF EXISTS media_assets_staff_manage ON public.media_assets;
CREATE POLICY media_assets_staff_manage ON public.media_assets
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS hero_slides_public_read ON public.hero_slides;
CREATE POLICY hero_slides_public_read ON public.hero_slides
  FOR SELECT TO anon, authenticated
  USING (
    is_active = TRUE
    AND deleted_at IS NULL
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

DROP POLICY IF EXISTS hero_slides_staff_manage ON public.hero_slides;
CREATE POLICY hero_slides_staff_manage ON public.hero_slides
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS news_posts_public_read ON public.news_posts;
CREATE POLICY news_posts_public_read ON public.news_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL AND (published_at IS NULL OR published_at <= NOW()));

DROP POLICY IF EXISTS news_posts_staff_manage ON public.news_posts;
CREATE POLICY news_posts_staff_manage ON public.news_posts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS events_public_read ON public.events;
CREATE POLICY events_public_read ON public.events
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL AND status <> 'cancelled' AND 'public' = ANY(audience));

DROP POLICY IF EXISTS events_staff_manage ON public.events;
CREATE POLICY events_staff_manage ON public.events
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_role(ARRAY['teacher']))
  WITH CHECK (public.is_admin() OR public.has_role(ARRAY['teacher']));

DROP POLICY IF EXISTS contact_inquiries_public_insert ON public.contact_inquiries;
CREATE POLICY contact_inquiries_public_insert ON public.contact_inquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS contact_inquiries_staff_manage ON public.contact_inquiries;
CREATE POLICY contact_inquiries_staff_manage ON public.contact_inquiries
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_role(ARRAY['hr_staff', 'it_support']))
  WITH CHECK (public.is_admin() OR public.has_role(ARRAY['hr_staff', 'it_support']));

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'terms', 'school_days', 'curriculum_units', 'lesson_plans',
    'lesson_plan_resources', 'course_materials', 'assignment_attachments',
    'submission_attachments', 'exam_sessions'
  ]
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_academic_read ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_academic_read ON public.%I FOR SELECT TO authenticated USING (deleted_at IS NULL)', table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_academic_manage ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_academic_manage ON public.%I FOR ALL TO authenticated USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff())', table_name, table_name);
  END LOOP;
END $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'admission_guardians', 'admission_documents', 'admission_interviews',
    'admission_status_history', 'admission_assessments'
  ]
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_staff_manage ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_staff_manage ON public.%I FOR ALL TO authenticated USING (public.is_admin() OR public.has_role(ARRAY[''hr_staff''])) WITH CHECK (public.is_admin() OR public.has_role(ARRAY[''hr_staff'']))', table_name, table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS staff_profiles_self_read ON public.staff_profiles;
CREATE POLICY staff_profiles_self_read ON public.staff_profiles
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (public.is_hr_staff() OR profile_id = auth.uid()));

DROP POLICY IF EXISTS staff_profiles_hr_manage ON public.staff_profiles;
CREATE POLICY staff_profiles_hr_manage ON public.staff_profiles
  FOR ALL TO authenticated
  USING (public.is_hr_staff())
  WITH CHECK (public.is_hr_staff());

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'staff_documents', 'staff_attendance_records', 'leave_requests'
  ]
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_staff_self_read ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_staff_self_read ON public.%I FOR SELECT TO authenticated USING (deleted_at IS NULL AND (public.is_hr_staff() OR EXISTS (SELECT 1 FROM public.staff_profiles sp WHERE sp.id = %I.staff_profile_id AND sp.profile_id = auth.uid())))', table_name, table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_hr_manage ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_hr_manage ON public.%I FOR ALL TO authenticated USING (public.is_hr_staff()) WITH CHECK (public.is_hr_staff())', table_name, table_name);
  END LOOP;
END $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'student_enrollments', 'student_medical_records', 'student_documents',
    'student_behavior_records'
  ]
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_student_member_read ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_student_member_read ON public.%I FOR SELECT TO authenticated USING (deleted_at IS NULL AND public.can_access_student(student_id))', table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_staff_manage ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_staff_manage ON public.%I FOR ALL TO authenticated USING (public.is_academic_staff()) WITH CHECK (public.is_academic_staff())', table_name, table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS student_scholarships_student_member_read ON public.student_scholarships;
CREATE POLICY student_scholarships_student_member_read ON public.student_scholarships
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.can_access_student(student_id));

DROP POLICY IF EXISTS student_scholarships_finance_manage ON public.student_scholarships;
CREATE POLICY student_scholarships_finance_manage ON public.student_scholarships
  FOR ALL TO authenticated
  USING (public.is_finance_staff())
  WITH CHECK (public.is_finance_staff());

DROP POLICY IF EXISTS student_transport_assignments_student_member_read ON public.student_transport_assignments;
CREATE POLICY student_transport_assignments_student_member_read ON public.student_transport_assignments
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.can_access_student(student_id));

DROP POLICY IF EXISTS student_transport_assignments_admin_manage ON public.student_transport_assignments;
CREATE POLICY student_transport_assignments_admin_manage ON public.student_transport_assignments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'fee_categories', 'fee_plans', 'fee_plan_items', 'invoice_items',
    'payment_allocations', 'scholarships', 'expenses',
    'payment_webhook_events'
  ]
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_finance_read ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_finance_read ON public.%I FOR SELECT TO authenticated USING (deleted_at IS NULL AND public.is_finance_staff())', table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_finance_manage ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_finance_manage ON public.%I FOR ALL TO authenticated USING (public.is_finance_staff()) WITH CHECK (public.is_finance_staff())', table_name, table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS invoices_finance_read ON public.invoices;
CREATE POLICY invoices_finance_read ON public.invoices
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (public.is_finance_staff() OR public.can_access_student(student_id)));

DROP POLICY IF EXISTS payments_finance_read ON public.payments;
CREATE POLICY payments_finance_read ON public.payments
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_finance_staff()
      OR EXISTS (
        SELECT 1
        FROM public.invoices i
        WHERE i.id = payments.invoice_id
          AND public.can_access_student(i.student_id)
          AND i.deleted_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS invoices_finance_write ON public.invoices;
CREATE POLICY invoices_finance_write ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_finance_staff())
  WITH CHECK (public.is_finance_staff());

DROP POLICY IF EXISTS payments_finance_write ON public.payments;
CREATE POLICY payments_finance_write ON public.payments
  FOR ALL TO authenticated
  USING (public.is_finance_staff())
  WITH CHECK (public.is_finance_staff());

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'job_applications', 'job_application_documents', 'job_application_status_history'
  ]
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_public_insert ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_public_insert ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (TRUE)', table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_hr_manage ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_hr_manage ON public.%I FOR ALL TO authenticated USING (public.is_hr_staff()) WITH CHECK (public.is_hr_staff())', table_name, table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS announcements_visible_read ON public.announcements;
CREATE POLICY announcements_visible_read ON public.announcements
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
    AND (
      CARDINALITY(audience_roles) = 0
      OR public.current_profile_role() = ANY(audience_roles)
    )
  );

DROP POLICY IF EXISTS announcements_staff_manage ON public.announcements;
CREATE POLICY announcements_staff_manage ON public.announcements
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_role(ARRAY['teacher', 'hr_staff', 'finance_officer']))
  WITH CHECK (public.is_admin() OR public.has_role(ARRAY['teacher', 'hr_staff', 'finance_officer']));

DROP POLICY IF EXISTS announcement_reads_self ON public.announcement_reads;
CREATE POLICY announcement_reads_self ON public.announcement_reads
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS message_attachments_member_read ON public.message_attachments;
CREATE POLICY message_attachments_member_read ON public.message_attachments
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_attachments.message_id
        AND cm.profile_id = auth.uid()
        AND cm.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS message_attachments_member_insert ON public.message_attachments;
CREATE POLICY message_attachments_member_insert ON public.message_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_attachments.message_id
        AND cm.profile_id = auth.uid()
        AND cm.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS notification_preferences_self ON public.notification_preferences;
CREATE POLICY notification_preferences_self ON public.notification_preferences
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS push_subscriptions_self ON public.push_subscriptions;
CREATE POLICY push_subscriptions_self ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['email_outbox', 'sms_outbox', 'system_jobs', 'integration_events']
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_admin_manage ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_admin_manage ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', table_name, table_name);
  END LOOP;
END $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'library_books', 'library_copies', 'library_loans', 'library_fines'
  ]
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_library_read ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_library_read ON public.%I FOR SELECT TO authenticated USING (deleted_at IS NULL)', table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_library_manage ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_library_manage ON public.%I FOR ALL TO authenticated USING (public.is_admin() OR public.has_role(ARRAY[''librarian''])) WITH CHECK (public.is_admin() OR public.has_role(ARRAY[''librarian'']))', table_name, table_name);
  END LOOP;
END $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['transport_routes', 'transport_stops', 'devices']
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_authenticated_read ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_authenticated_read ON public.%I FOR SELECT TO authenticated USING (deleted_at IS NULL)', table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_admin_manage ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE POLICY %I_admin_manage ON public.%I FOR ALL TO authenticated USING (public.is_admin() OR public.has_role(ARRAY[''it_support''])) WITH CHECK (public.is_admin() OR public.has_role(ARRAY[''it_support'']))', table_name, table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS support_tickets_member_read ON public.support_tickets;
CREATE POLICY support_tickets_member_read ON public.support_tickets
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (requester_id = auth.uid() OR assigned_to = auth.uid() OR public.is_admin() OR public.has_role(ARRAY['it_support'])));

DROP POLICY IF EXISTS support_tickets_member_insert ON public.support_tickets;
CREATE POLICY support_tickets_member_insert ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() OR public.is_admin() OR public.has_role(ARRAY['it_support']));

DROP POLICY IF EXISTS support_tickets_staff_update ON public.support_tickets;
CREATE POLICY support_tickets_staff_update ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_role(ARRAY['it_support']) OR requester_id = auth.uid())
  WITH CHECK (public.is_admin() OR public.has_role(ARRAY['it_support']) OR requester_id = auth.uid());

DROP POLICY IF EXISTS support_ticket_comments_member ON public.support_ticket_comments;
CREATE POLICY support_ticket_comments_member ON public.support_ticket_comments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.support_tickets st
      WHERE st.id = support_ticket_comments.ticket_id
        AND (st.requester_id = auth.uid() OR st.assigned_to = auth.uid() OR public.is_admin() OR public.has_role(ARRAY['it_support']))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.support_tickets st
      WHERE st.id = support_ticket_comments.ticket_id
        AND (st.requester_id = auth.uid() OR st.assigned_to = auth.uid() OR public.is_admin() OR public.has_role(ARRAY['it_support']))
    )
  );

DROP POLICY IF EXISTS ai_tutor_sessions_self ON public.ai_tutor_sessions;
CREATE POLICY ai_tutor_sessions_self ON public.ai_tutor_sessions
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS ai_tutor_messages_self ON public.ai_tutor_messages;
CREATE POLICY ai_tutor_messages_self ON public.ai_tutor_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_tutor_sessions s
      WHERE s.id = ai_tutor_messages.session_id
        AND s.profile_id = auth.uid()
        AND s.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ai_tutor_sessions s
      WHERE s.id = ai_tutor_messages.session_id
        AND s.profile_id = auth.uid()
        AND s.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS ai_usage_logs_self_or_admin ON public.ai_usage_logs;
CREATE POLICY ai_usage_logs_self_or_admin ON public.ai_usage_logs
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS files_access_read ON public.files;
CREATE POLICY files_access_read ON public.files
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      visibility = 'school'
      OR owner_id = auth.uid()
      OR uploaded_by = auth.uid()
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS files_access_write ON public.files;
CREATE POLICY files_access_write ON public.files
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR uploaded_by = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR uploaded_by = auth.uid() OR public.is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('public-assets', 'public-assets', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::TEXT[]),
  ('school-media', 'school-media', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']::TEXT[]),
  ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]),
  ('admission-documents', 'admission-documents', FALSE, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']::TEXT[]),
  ('student-documents', 'student-documents', FALSE, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']::TEXT[]),
  ('staff-documents', 'staff-documents', FALSE, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']::TEXT[]),
  ('recruitment-documents', 'recruitment-documents', FALSE, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']::TEXT[]),
  ('assignment-submissions', 'assignment-submissions', FALSE, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']::TEXT[]),
  ('lesson-resources', 'lesson-resources', FALSE, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4']::TEXT[]),
  ('report-cards', 'report-cards', FALSE, 10485760, ARRAY['application/pdf']::TEXT[]),
  ('message-attachments', 'message-attachments', FALSE, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']::TEXT[]),
  ('finance-documents', 'finance-documents', FALSE, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']::TEXT[]),
  ('system-backups', 'system-backups', FALSE, 52428800, ARRAY['application/zip', 'application/json', 'text/csv']::TEXT[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS storage_public_read ON storage.objects;
CREATE POLICY storage_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('public-assets', 'school-media', 'avatars'));

DROP POLICY IF EXISTS storage_public_staff_insert ON storage.objects;
CREATE POLICY storage_public_staff_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('public-assets', 'school-media')
    AND public.is_admin()
  );

DROP POLICY IF EXISTS storage_public_staff_update ON storage.objects;
CREATE POLICY storage_public_staff_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('public-assets', 'school-media')
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id IN ('public-assets', 'school-media')
    AND public.is_admin()
  );

DROP POLICY IF EXISTS storage_public_staff_delete ON storage.objects;
CREATE POLICY storage_public_staff_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('public-assets', 'school-media')
    AND public.is_admin()
  );

DROP POLICY IF EXISTS storage_avatar_owner_insert ON storage.objects;
CREATE POLICY storage_avatar_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS storage_avatar_owner_update ON storage.objects;
CREATE POLICY storage_avatar_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS storage_avatar_owner_delete ON storage.objects;
CREATE POLICY storage_avatar_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS storage_private_owner_read ON storage.objects;
CREATE POLICY storage_private_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN (
      'admission-documents', 'student-documents', 'staff-documents',
      'recruitment-documents', 'assignment-submissions', 'lesson-resources',
      'report-cards', 'message-attachments', 'finance-documents', 'system-backups'
    )
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS storage_private_owner_insert ON storage.objects;
CREATE POLICY storage_private_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN (
      'admission-documents', 'student-documents', 'staff-documents',
      'recruitment-documents', 'assignment-submissions', 'lesson-resources',
      'report-cards', 'message-attachments', 'finance-documents'
    )
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS storage_private_owner_update ON storage.objects;
CREATE POLICY storage_private_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN (
      'admission-documents', 'student-documents', 'staff-documents',
      'recruitment-documents', 'assignment-submissions', 'lesson-resources',
      'report-cards', 'message-attachments', 'finance-documents'
    )
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id IN (
      'admission-documents', 'student-documents', 'staff-documents',
      'recruitment-documents', 'assignment-submissions', 'lesson-resources',
      'report-cards', 'message-attachments', 'finance-documents'
    )
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS storage_private_owner_delete ON storage.objects;
CREATE POLICY storage_private_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN (
      'admission-documents', 'student-documents', 'staff-documents',
      'recruitment-documents', 'assignment-submissions', 'lesson-resources',
      'report-cards', 'message-attachments', 'finance-documents'
    )
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS storage_academic_staff_manage ON storage.objects;
CREATE POLICY storage_academic_staff_manage ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('student-documents', 'assignment-submissions', 'lesson-resources', 'report-cards')
    AND public.is_academic_staff()
  )
  WITH CHECK (
    bucket_id IN ('student-documents', 'assignment-submissions', 'lesson-resources', 'report-cards')
    AND public.is_academic_staff()
  );

DROP POLICY IF EXISTS storage_hr_staff_manage ON storage.objects;
CREATE POLICY storage_hr_staff_manage ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('staff-documents', 'recruitment-documents', 'admission-documents')
    AND public.is_hr_staff()
  )
  WITH CHECK (
    bucket_id IN ('staff-documents', 'recruitment-documents', 'admission-documents')
    AND public.is_hr_staff()
  );

DROP POLICY IF EXISTS storage_finance_staff_manage ON storage.objects;
CREATE POLICY storage_finance_staff_manage ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'finance-documents'
    AND public.is_finance_staff()
  )
  WITH CHECK (
    bucket_id = 'finance-documents'
    AND public.is_finance_staff()
  );

DROP POLICY IF EXISTS storage_admin_all_private_manage ON storage.objects;
CREATE POLICY storage_admin_all_private_manage ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN (
      'admission-documents', 'student-documents', 'staff-documents',
      'recruitment-documents', 'assignment-submissions', 'lesson-resources',
      'report-cards', 'message-attachments', 'finance-documents', 'system-backups'
    )
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id IN (
      'admission-documents', 'student-documents', 'staff-documents',
      'recruitment-documents', 'assignment-submissions', 'lesson-resources',
      'report-cards', 'message-attachments', 'finance-documents', 'system-backups'
    )
    AND public.is_admin()
  );

INSERT INTO public.school_settings (key, value, description, is_public)
VALUES
  ('school.identity', '{"name":"Crestview International School","motto":"Where excellence meets the world"}', 'Public school identity and branding', TRUE),
  ('storage.pathing', '{"privateBuckets":"Use the authenticated user UUID as the first folder segment, for example <user-id>/documents/file.pdf."}', 'Storage object path convention used by RLS policies', FALSE)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();
