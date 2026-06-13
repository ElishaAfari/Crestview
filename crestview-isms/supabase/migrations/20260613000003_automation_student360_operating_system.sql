CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_key TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'school' CHECK (scope IN ('school', 'admissions', 'academics', 'finance', 'hr', 'library', 'it', 'communications')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  audience_roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  conditions JSONB NOT NULL DEFAULT '{}'::JSONB,
  actions JSONB NOT NULL DEFAULT '[]'::JSONB,
  priority INTEGER NOT NULL DEFAULT 100,
  created_by UUID REFERENCES public.profiles(id),
  last_triggered_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (event_key, name)
);

CREATE TABLE IF NOT EXISTS public.workflow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  workflow_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'blocked', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  parent_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  staff_profile_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  related_table TEXT,
  related_record_id UUID,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.student_360_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'academic', 'attendance', 'finance', 'wellbeing', 'discipline', 'parent_contact')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'staff' CHECK (visibility IN ('staff', 'guardian', 'restricted')),
  created_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.communication_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'sms', 'push', 'multi')),
  audience_type TEXT NOT NULL DEFAULT 'roles' CHECK (audience_type IN ('roles', 'classroom', 'students', 'parents', 'staff', 'all')),
  audience_roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.communication_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.communication_campaigns(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'read', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.student_documents
  ADD COLUMN IF NOT EXISTS required_for_enrollment BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB;

ALTER TABLE public.staff_documents
  ADD COLUMN IF NOT EXISTS required_for_employment BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE INDEX IF NOT EXISTS idx_automation_rules_event_active
  ON public.automation_rules(event_key, is_active, priority)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status_priority
  ON public.workflow_tasks(status, priority, due_at)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned
  ON public.workflow_tasks(assigned_to, status, due_at)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_student
  ON public.workflow_tasks(student_id, status, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_360_notes_student
  ON public.student_360_notes(student_id, note_type, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_communication_campaigns_status
  ON public.communication_campaigns(status, scheduled_for)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_communication_recipients_profile
  ON public.communication_recipients(profile_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.student_360_overview AS
WITH attendance AS (
  SELECT
    student_id,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_attendance,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND status IN ('present', 'late')) AS present_attendance,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'absent') AS absent_attendance,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND attendance_date >= CURRENT_DATE - INTERVAL '30 days') AS attendance_last_30_days,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND attendance_date >= CURRENT_DATE - INTERVAL '30 days' AND status IN ('present', 'late')) AS present_last_30_days
  FROM public.attendance_records
  GROUP BY student_id
),
grades AS (
  SELECT
    student_id,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS grade_count,
    ROUND(AVG(COALESCE(total_score, percentage, score)) FILTER (WHERE deleted_at IS NULL), 2) AS grade_average,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND COALESCE(total_score, percentage, score) < 50) AS low_grade_count
  FROM public.grades
  GROUP BY student_id
),
finance AS (
  SELECT
    student_id,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND status IN ('draft', 'open', 'overdue')) AS open_invoice_count,
    COALESCE(SUM(amount) FILTER (WHERE deleted_at IS NULL AND status IN ('draft', 'open', 'overdue')), 0) AS open_invoice_amount,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'overdue') AS overdue_invoice_count
  FROM public.invoices
  GROUP BY student_id
),
reports AS (
  SELECT
    student_id,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS report_count,
    MAX(published_at) FILTER (WHERE deleted_at IS NULL) AS last_report_at
  FROM public.reports
  GROUP BY student_id
),
notes AS (
  SELECT
    student_id,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS note_count,
    MAX(created_at) FILTER (WHERE deleted_at IS NULL) AS last_note_at
  FROM public.student_360_notes
  GROUP BY student_id
)
SELECT
  s.id AS student_id,
  s.student_number,
  s.profile_id,
  s.classroom_id,
  s.status,
  p.first_name,
  p.last_name,
  p.email,
  c.name AS classroom_name,
  c.grade_level,
  COALESCE(a.total_attendance, 0) AS total_attendance,
  COALESCE(a.present_attendance, 0) AS present_attendance,
  COALESCE(a.absent_attendance, 0) AS absent_attendance,
  CASE
    WHEN COALESCE(a.total_attendance, 0) = 0 THEN 0
    ELSE ROUND((a.present_attendance::NUMERIC / NULLIF(a.total_attendance, 0)) * 100, 2)
  END AS attendance_rate,
  CASE
    WHEN COALESCE(a.attendance_last_30_days, 0) = 0 THEN 0
    ELSE ROUND((a.present_last_30_days::NUMERIC / NULLIF(a.attendance_last_30_days, 0)) * 100, 2)
  END AS attendance_rate_30_days,
  COALESCE(g.grade_count, 0) AS grade_count,
  COALESCE(g.grade_average, 0) AS grade_average,
  COALESCE(g.low_grade_count, 0) AS low_grade_count,
  COALESCE(f.open_invoice_count, 0) AS open_invoice_count,
  COALESCE(f.open_invoice_amount, 0) AS open_invoice_amount,
  COALESCE(f.overdue_invoice_count, 0) AS overdue_invoice_count,
  COALESCE(r.report_count, 0) AS report_count,
  r.last_report_at,
  COALESCE(n.note_count, 0) AS note_count,
  n.last_note_at,
  CASE
    WHEN COALESCE(a.total_attendance, 0) >= 5 AND ((a.present_attendance::NUMERIC / NULLIF(a.total_attendance, 0)) * 100) < 85 THEN 'red'
    WHEN COALESCE(g.low_grade_count, 0) >= 2 THEN 'red'
    WHEN COALESCE(f.overdue_invoice_count, 0) > 0 THEN 'amber'
    WHEN COALESCE(g.grade_average, 0) >= 75 AND (
      COALESCE(a.total_attendance, 0) = 0
      OR ((a.present_attendance::NUMERIC / NULLIF(a.total_attendance, 0)) * 100) >= 90
    ) THEN 'green'
    ELSE 'amber'
  END AS risk_level
FROM public.students s
JOIN public.profiles p ON p.id = s.profile_id
LEFT JOIN public.classrooms c ON c.id = s.classroom_id
LEFT JOIN attendance a ON a.student_id = s.id
LEFT JOIN grades g ON g.student_id = s.id
LEFT JOIN finance f ON f.student_id = s.id
LEFT JOIN reports r ON r.student_id = s.id
LEFT JOIN notes n ON n.student_id = s.id
WHERE s.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.workflow_task_overview AS
SELECT
  wt.id,
  wt.task_number,
  wt.title,
  wt.description,
  wt.workflow_key,
  wt.status,
  wt.priority,
  wt.due_at,
  wt.assigned_to,
  wt.created_by,
  wt.student_id,
  wt.parent_profile_id,
  wt.staff_profile_id,
  wt.classroom_id,
  wt.related_table,
  wt.related_record_id,
  wt.completed_at,
  wt.metadata,
  wt.created_at,
  assignee.first_name || ' ' || assignee.last_name AS assignee_name,
  creator.first_name || ' ' || creator.last_name AS creator_name,
  p.first_name || ' ' || p.last_name AS student_name,
  s.student_number,
  c.name AS classroom_name,
  c.grade_level
FROM public.workflow_tasks wt
LEFT JOIN public.profiles assignee ON assignee.id = wt.assigned_to
LEFT JOIN public.profiles creator ON creator.id = wt.created_by
LEFT JOIN public.students s ON s.id = wt.student_id
LEFT JOIN public.profiles p ON p.id = s.profile_id
LEFT JOIN public.classrooms c ON c.id = wt.classroom_id
WHERE wt.deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.next_task_number(prefix TEXT DEFAULT 'TASK')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN upper(prefix) || '-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::TEXT, 1, 6));
END;
$$;

CREATE OR REPLACE FUNCTION public.create_workflow_task(
  p_title TEXT,
  p_workflow_key TEXT,
  p_description TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_due_at TIMESTAMPTZ DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL,
  p_parent_profile_id UUID DEFAULT NULL,
  p_staff_profile_id UUID DEFAULT NULL,
  p_classroom_id UUID DEFAULT NULL,
  p_related_table TEXT DEFAULT NULL,
  p_related_record_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_task_id UUID;
BEGIN
  INSERT INTO public.workflow_tasks (
    task_number,
    title,
    description,
    workflow_key,
    priority,
    due_at,
    assigned_to,
    created_by,
    student_id,
    parent_profile_id,
    staff_profile_id,
    classroom_id,
    related_table,
    related_record_id,
    metadata
  )
  VALUES (
    public.next_task_number('TASK'),
    p_title,
    p_description,
    p_workflow_key,
    p_priority,
    p_due_at,
    p_assigned_to,
    p_created_by,
    p_student_id,
    p_parent_profile_id,
    p_staff_profile_id,
    p_classroom_id,
    p_related_table,
    p_related_record_id,
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO new_task_id;

  RETURN new_task_id;
END;
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'automation_rules',
    'workflow_tasks',
    'student_360_notes',
    'communication_campaigns',
    'communication_recipients'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.set_updated_at()', table_name);
  END LOOP;
END $$;

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_360_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_rules_admin_manage ON public.automation_rules;
CREATE POLICY automation_rules_admin_manage ON public.automation_rules
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS workflow_tasks_staff_read ON public.workflow_tasks;
CREATE POLICY workflow_tasks_staff_read ON public.workflow_tasks
  FOR SELECT TO authenticated
  USING (
    private.is_admin()
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND r.name IN ('teacher', 'hr_staff', 'finance_officer', 'librarian', 'it_support')
    )
  );

DROP POLICY IF EXISTS workflow_tasks_staff_manage ON public.workflow_tasks;
CREATE POLICY workflow_tasks_staff_manage ON public.workflow_tasks
  FOR ALL TO authenticated
  USING (
    private.is_admin()
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND r.name IN ('teacher', 'hr_staff', 'finance_officer', 'librarian', 'it_support')
    )
  )
  WITH CHECK (
    private.is_admin()
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND r.name IN ('teacher', 'hr_staff', 'finance_officer', 'librarian', 'it_support')
    )
  );

DROP POLICY IF EXISTS student_360_notes_staff_read ON public.student_360_notes;
CREATE POLICY student_360_notes_staff_read ON public.student_360_notes
  FOR SELECT TO authenticated
  USING (
    private.is_admin()
    OR visibility <> 'restricted'
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS student_360_notes_staff_manage ON public.student_360_notes;
CREATE POLICY student_360_notes_staff_manage ON public.student_360_notes
  FOR ALL TO authenticated
  USING (
    private.is_admin()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND r.name IN ('teacher', 'hr_staff')
    )
  )
  WITH CHECK (
    private.is_admin()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND r.name IN ('teacher', 'hr_staff')
    )
  );

DROP POLICY IF EXISTS communication_campaigns_staff_manage ON public.communication_campaigns;
CREATE POLICY communication_campaigns_staff_manage ON public.communication_campaigns
  FOR ALL TO authenticated
  USING (
    private.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND r.name IN ('teacher', 'hr_staff')
    )
  )
  WITH CHECK (
    private.is_admin()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND r.name IN ('teacher', 'hr_staff')
    )
  );

DROP POLICY IF EXISTS communication_recipients_member_read ON public.communication_recipients;
CREATE POLICY communication_recipients_member_read ON public.communication_recipients
  FOR SELECT TO authenticated
  USING (
    private.is_admin()
    OR profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.communication_campaigns c
      WHERE c.id = communication_recipients.campaign_id
        AND c.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS communication_recipients_staff_manage ON public.communication_recipients;
CREATE POLICY communication_recipients_staff_manage ON public.communication_recipients
  FOR ALL TO authenticated
  USING (
    private.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.communication_campaigns c
      WHERE c.id = communication_recipients.campaign_id
        AND c.created_by = auth.uid()
    )
  )
  WITH CHECK (
    private.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.communication_campaigns c
      WHERE c.id = communication_recipients.campaign_id
        AND c.created_by = auth.uid()
    )
  );

INSERT INTO public.automation_rules (name, event_key, scope, description, audience_roles, actions, priority, metadata)
VALUES
  (
    'Admission accepted onboarding',
    'admission.accepted',
    'admissions',
    'Create parent and student follow-up tasks after an applicant is accepted.',
    ARRAY['super_admin', 'school_admin'],
    '[{"type":"create_task","workflow_key":"admissions_onboarding"},{"type":"notify_parent"},{"type":"queue_document_check"}]'::JSONB,
    10,
    '{"seeded":true}'::JSONB
  ),
  (
    'Class invoice issued',
    'invoice.class_batch_created',
    'finance',
    'Track class billing batches, parent notices, and payment follow-up.',
    ARRAY['super_admin', 'school_admin', 'finance_officer'],
    '[{"type":"notify_parent"},{"type":"create_task","workflow_key":"finance_collection"}]'::JSONB,
    20,
    '{"seeded":true}'::JSONB
  ),
  (
    'Daily attendance submitted',
    'attendance.register_submitted',
    'academics',
    'Review absence patterns and keep attendance registers locked for the school day.',
    ARRAY['super_admin', 'school_admin', 'teacher'],
    '[{"type":"update_dashboard"},{"type":"create_absence_follow_up"}]'::JSONB,
    30,
    '{"seeded":true}'::JSONB
  ),
  (
    'Term report published',
    'report.published',
    'academics',
    'Share student reports and keep an academic follow-up trail for parents and teachers.',
    ARRAY['super_admin', 'school_admin', 'teacher', 'parent', 'student'],
    '[{"type":"notify_parent"},{"type":"notify_student"},{"type":"create_task","workflow_key":"academic_follow_up"}]'::JSONB,
    40,
    '{"seeded":true}'::JSONB
  ),
  (
    'Support ticket opened',
    'support.ticket_opened',
    'it',
    'Route technical support requests to the IT desk.',
    ARRAY['super_admin', 'school_admin', 'it_support'],
    '[{"type":"assign_it"},{"type":"notify_requester"}]'::JSONB,
    50,
    '{"seeded":true}'::JSONB
  )
ON CONFLICT (event_key, name) DO UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    audience_roles = EXCLUDED.audience_roles,
    actions = EXCLUDED.actions,
    priority = EXCLUDED.priority,
    deleted_at = NULL,
    updated_at = NOW();
