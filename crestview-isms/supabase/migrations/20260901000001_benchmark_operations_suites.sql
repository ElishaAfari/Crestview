-- Benchmark-inspired operational suites for reception, communication, transport,
-- inventory, examinations, and learner wellbeing.

CREATE TABLE IF NOT EXISTS public.front_office_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT NOT NULL DEFAULT 'walk_in' CHECK (source IN ('walk_in', 'phone', 'website', 'referral', 'social_media', 'other')),
  interest_area TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'tour_booked', 'converted', 'closed')),
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  purpose TEXT NOT NULL,
  person_to_see TEXT,
  badge_number TEXT,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('expected', 'checked_in', 'checked_out', 'flagged')),
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (checked_out_at IS NULL OR checked_out_at >= checked_in_at)
);

CREATE TABLE IF NOT EXISTS public.parent_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number TEXT NOT NULL UNIQUE,
  submitted_by UUID REFERENCES public.profiles(id),
  student_id UUID REFERENCES public.students(id),
  guardian_name TEXT,
  guardian_phone TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
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
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'each',
  quantity_on_hand NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  reorder_level NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'low_stock', 'reserved', 'retired')),
  managed_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_number TEXT NOT NULL UNIQUE,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_label TEXT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('received', 'issued', 'returned', 'adjusted', 'disposed')),
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.transport_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL UNIQUE,
  registration_number TEXT UNIQUE,
  vehicle_label TEXT NOT NULL,
  driver_profile_id UUID REFERENCES public.profiles(id),
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  insurance_expires_on DATE,
  roadworthy_expires_on DATE,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.transport_trip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.transport_routes(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  direction TEXT NOT NULL DEFAULT 'pickup' CHECK (direction IN ('pickup', 'dropoff')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'departed', 'completed', 'cancelled')),
  students_onboard INTEGER NOT NULL DEFAULT 0 CHECK (students_onboard >= 0),
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.exam_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id),
  term TEXT NOT NULL DEFAULT 'Term 1',
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'archived')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.learner_wellbeing_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  learner_name TEXT,
  category TEXT NOT NULL DEFAULT 'wellbeing' CHECK (category IN ('wellbeing', 'discipline', 'safeguarding', 'health', 'counselling')),
  risk_level public.risk_level NOT NULL DEFAULT 'green',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'monitoring', 'resolved', 'closed')),
  summary TEXT NOT NULL,
  action_plan TEXT,
  opened_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.class_subject_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  grade_level TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  term TEXT NOT NULL DEFAULT 'Term 1',
  week_number INTEGER NOT NULL DEFAULT 1 CHECK (week_number BETWEEN 1 AND 16),
  topic TEXT NOT NULL,
  objectives TEXT,
  resources TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'archived')),
  created_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_front_office_enquiries_status ON public.front_office_enquiries(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_status ON public.visitor_logs(status, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_complaints_status ON public.parent_complaints(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_campaigns_status ON public.communication_campaigns(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON public.inventory_items(status, category);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON public.inventory_movements(movement_date DESC, movement_type);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_status ON public.transport_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_transport_trip_logs_date ON public.transport_trip_logs(trip_date DESC, direction);
CREATE INDEX IF NOT EXISTS idx_exam_windows_status ON public.exam_windows(status, starts_on);
CREATE INDEX IF NOT EXISTS idx_learner_wellbeing_cases_status ON public.learner_wellbeing_cases(status, risk_level);
CREATE INDEX IF NOT EXISTS idx_class_subject_schemes_lookup ON public.class_subject_schemes(grade_level, subject_name, term, week_number);

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'front_office_enquiries', 'visitor_logs', 'parent_complaints',
    'communication_campaigns', 'inventory_items', 'inventory_movements',
    'transport_vehicles', 'transport_trip_logs', 'exam_windows',
    'learner_wellbeing_cases', 'class_subject_schemes'
  ]
  LOOP
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.set_updated_at()', table_name, table_name);
    EXECUTE FORMAT('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_audit ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.write_audit_log()', table_name, table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS front_office_enquiries_staff_manage ON public.front_office_enquiries;
CREATE POLICY front_office_enquiries_staff_manage ON public.front_office_enquiries
  FOR ALL TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'hr_staff']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'hr_staff']));

DROP POLICY IF EXISTS visitor_logs_staff_manage ON public.visitor_logs;
CREATE POLICY visitor_logs_staff_manage ON public.visitor_logs
  FOR ALL TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'hr_staff']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'hr_staff']));

DROP POLICY IF EXISTS parent_complaints_parent_insert ON public.parent_complaints;
CREATE POLICY parent_complaints_parent_insert ON public.parent_complaints
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid() OR private.is_admin());

DROP POLICY IF EXISTS parent_complaints_parent_read ON public.parent_complaints;
CREATE POLICY parent_complaints_parent_read ON public.parent_complaints
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (submitted_by = auth.uid() OR private.has_role(ARRAY['super_admin', 'school_admin', 'hr_staff'])));

DROP POLICY IF EXISTS parent_complaints_staff_manage ON public.parent_complaints;
CREATE POLICY parent_complaints_staff_manage ON public.parent_complaints
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'hr_staff']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'hr_staff']));

DROP POLICY IF EXISTS communication_campaigns_staff_manage ON public.communication_campaigns;
CREATE POLICY communication_campaigns_staff_manage ON public.communication_campaigns
  FOR ALL TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'it_support']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'it_support']));

DROP POLICY IF EXISTS inventory_items_staff_manage ON public.inventory_items;
CREATE POLICY inventory_items_staff_manage ON public.inventory_items
  FOR ALL TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer', 'it_support']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer', 'it_support']));

DROP POLICY IF EXISTS inventory_movements_staff_manage ON public.inventory_movements;
CREATE POLICY inventory_movements_staff_manage ON public.inventory_movements
  FOR ALL TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer', 'it_support']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer', 'it_support']));

DROP POLICY IF EXISTS transport_vehicles_staff_manage ON public.transport_vehicles;
CREATE POLICY transport_vehicles_staff_manage ON public.transport_vehicles
  FOR ALL TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer', 'it_support']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer', 'it_support']));

DROP POLICY IF EXISTS transport_trip_logs_staff_manage ON public.transport_trip_logs;
CREATE POLICY transport_trip_logs_staff_manage ON public.transport_trip_logs
  FOR ALL TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer', 'it_support']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer', 'it_support']));

DROP POLICY IF EXISTS exam_windows_academic_manage ON public.exam_windows;
CREATE POLICY exam_windows_academic_manage ON public.exam_windows
  FOR ALL TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'teacher']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'teacher']));

DROP POLICY IF EXISTS exam_windows_family_read ON public.exam_windows;
CREATE POLICY exam_windows_family_read ON public.exam_windows
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND status IN ('published', 'completed'));

DROP POLICY IF EXISTS learner_wellbeing_cases_staff_manage ON public.learner_wellbeing_cases;
CREATE POLICY learner_wellbeing_cases_staff_manage ON public.learner_wellbeing_cases
  FOR ALL TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'teacher', 'hr_staff']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'teacher', 'hr_staff']));

DROP POLICY IF EXISTS class_subject_schemes_academic_manage ON public.class_subject_schemes;
CREATE POLICY class_subject_schemes_academic_manage ON public.class_subject_schemes
  FOR ALL TO authenticated
  USING (deleted_at IS NULL AND private.has_role(ARRAY['super_admin', 'school_admin', 'teacher']))
  WITH CHECK (private.has_role(ARRAY['super_admin', 'school_admin', 'teacher']));
