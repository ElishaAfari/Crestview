-- Keep RLS helper functions callable by policies without exposing them as public RPC endpoints.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.current_profile_role() SET SCHEMA private;
ALTER FUNCTION public.has_role(TEXT[]) SET SCHEMA private;
ALTER FUNCTION public.is_admin() SET SCHEMA private;
ALTER FUNCTION public.is_academic_staff() SET SCHEMA private;
ALTER FUNCTION public.is_finance_staff() SET SCHEMA private;
ALTER FUNCTION public.is_hr_staff() SET SCHEMA private;
ALTER FUNCTION public.can_access_student(UUID) SET SCHEMA private;
ALTER FUNCTION public.can_access_profile(UUID) SET SCHEMA private;
ALTER FUNCTION public.set_updated_at() SET SCHEMA private;
ALTER FUNCTION public.write_audit_log() SET SCHEMA private;

CREATE OR REPLACE FUNCTION private.current_profile_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT r.name
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
    AND p.deleted_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.has_role(role_names TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE(private.current_profile_role() = ANY(role_names), FALSE);
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.has_role(ARRAY['super_admin', 'school_admin']);
$$;

CREATE OR REPLACE FUNCTION private.is_academic_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.has_role(ARRAY['super_admin', 'school_admin', 'teacher']);
$$;

CREATE OR REPLACE FUNCTION private.is_finance_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer']);
$$;

CREATE OR REPLACE FUNCTION private.is_hr_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.has_role(ARRAY['super_admin', 'school_admin', 'hr_staff']);
$$;

CREATE OR REPLACE FUNCTION private.can_access_student(student_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE(
    private.is_admin()
    OR private.has_role(ARRAY['teacher'])
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

CREATE OR REPLACE FUNCTION private.can_access_profile(profile_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE(
    profile_uuid = auth.uid()
    OR private.is_admin()
    OR private.is_hr_staff(),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.write_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
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

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  private.current_profile_role(),
  private.has_role(TEXT[]),
  private.is_admin(),
  private.is_academic_staff(),
  private.is_finance_staff(),
  private.is_hr_staff(),
  private.can_access_student(UUID),
  private.can_access_profile(UUID)
TO authenticated, service_role;

DO $$
BEGIN
  IF TO_REGPROCEDURE('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO postgres, service_role;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

DROP POLICY IF EXISTS admissions_public_insert ON public.admission_applications;
CREATE POLICY admissions_public_insert ON public.admission_applications
  FOR INSERT TO anon
  WITH CHECK (
    LENGTH(BTRIM(applicant_first_name)) BETWEEN 1 AND 120
    AND LENGTH(BTRIM(applicant_last_name)) BETWEEN 1 AND 120
    AND LENGTH(BTRIM(applying_grade)) BETWEEN 1 AND 80
    AND guardian_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND status = 'submitted'
    AND assigned_to IS NULL
    AND decision_at IS NULL
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS contact_inquiries_public_insert ON public.contact_inquiries;
CREATE POLICY contact_inquiries_public_insert ON public.contact_inquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    LENGTH(BTRIM(full_name)) BETWEEN 1 AND 160
    AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND LENGTH(BTRIM(message)) BETWEEN 1 AND 5000
    AND status = 'new'
    AND assigned_to IS NULL
    AND resolved_at IS NULL
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS job_applications_public_insert ON public.job_applications;
CREATE POLICY job_applications_public_insert ON public.job_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    LENGTH(BTRIM(first_name)) BETWEEN 1 AND 120
    AND LENGTH(BTRIM(last_name)) BETWEEN 1 AND 120
    AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND status = 'submitted'
    AND assigned_to IS NULL
    AND deleted_at IS NULL
  );

-- Candidate uploads need a signed server-side flow before anonymous writes are safe.
DROP POLICY IF EXISTS job_application_documents_public_insert ON public.job_application_documents;
DROP POLICY IF EXISTS job_application_status_history_public_insert ON public.job_application_status_history;
