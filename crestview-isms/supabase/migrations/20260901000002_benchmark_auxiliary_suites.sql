-- Additional benchmark-inspired suites: ID cards, preschool, bursary,
-- accounting, daily services, and boarding operations.

CREATE TABLE IF NOT EXISTS public.staff_id_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  card_number TEXT NOT NULL UNIQUE,
  staff_number TEXT NOT NULL,
  qr_payload TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'lost', 'reissued', 'retired')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_on DATE,
  issued_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.id_card_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_code TEXT NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'student' CHECK (card_type IN ('student', 'staff', 'unknown')),
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'revoked', 'missing', 'unknown')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.preschool_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  arrival_time TIME,
  pickup_time TIME,
  meal_status TEXT CHECK (meal_status IN ('not_recorded', 'ate_well', 'ate_some', 'did_not_eat')),
  nap_status TEXT CHECK (nap_status IN ('not_recorded', 'slept_well', 'short_rest', 'no_sleep')),
  mood TEXT CHECK (mood IN ('settled', 'happy', 'tired', 'upset', 'unwell', 'not_recorded')),
  toileting TEXT,
  report_sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_to_parent_at TIMESTAMPTZ,
  teacher_notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (student_id, log_date)
);

CREATE TABLE IF NOT EXISTS public.preschool_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  domain TEXT NOT NULL DEFAULT 'other' CHECK (domain IN ('literacy', 'numeracy', 'creative_arts', 'social_emotional', 'motor', 'self_care', 'other')),
  title TEXT NOT NULL,
  observation TEXT NOT NULL,
  next_steps TEXT,
  shared_with_parent BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.preschool_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  guardian_name TEXT NOT NULL,
  relationship TEXT,
  pickup_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_method TEXT NOT NULL DEFAULT 'staff_confirmed' CHECK (verification_method IN ('id_card', 'known_guardian', 'phone_confirmed', 'staff_confirmed', 'other')),
  status TEXT NOT NULL DEFAULT 'picked_up' CHECK (status IN ('expected', 'picked_up', 'late', 'blocked')),
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.preschool_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT NOT NULL UNIQUE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  category TEXT NOT NULL DEFAULT 'health' CHECK (category IN ('health', 'safety', 'behaviour', 'safeguarding', 'other')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary TEXT NOT NULL,
  action_taken TEXT,
  parent_notified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'monitoring', 'resolved', 'closed')),
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.cashier_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number TEXT NOT NULL UNIQUE,
  cashier_id UUID REFERENCES public.profiles(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_float NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (opening_float >= 0),
  cash_expected NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cash_expected >= 0),
  cash_counted NUMERIC(12,2) CHECK (cash_counted IS NULL OR cash_counted >= 0),
  mobile_money_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (mobile_money_total >= 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reconciled', 'flagged')),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (closed_at IS NULL OR closed_at >= opened_at)
);

CREATE TABLE IF NOT EXISTS public.bursary_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  session_id UUID REFERENCES public.cashier_sessions(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  payer_name TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'GHS',
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'mobile_money', 'card', 'bank', 'other')),
  service_type TEXT NOT NULL DEFAULT 'daily_fee' CHECK (service_type IN ('daily_fee', 'feeding', 'extra_classes', 'transport', 'invoice', 'other')),
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'void', 'refunded')),
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.fiscal_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number TEXT NOT NULL UNIQUE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  memo TEXT NOT NULL,
  source_module TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  posted_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  account_code TEXT,
  description TEXT,
  debit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (debit > 0 OR credit > 0)
);

CREATE TABLE IF NOT EXISTS public.supplier_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'GHS',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid', 'overdue', 'void')),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  currency TEXT NOT NULL DEFAULT 'GHS',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.student_service_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL CHECK (service_type IN ('feeding', 'extra_classes')),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on DATE,
  daily_rate NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (daily_rate >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'exempt', 'ended')),
  approved_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.student_service_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL CHECK (service_type IN ('feeding', 'extra_classes')),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'GHS',
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'mobile_money', 'card', 'bank', 'other')),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'waived', 'reversed')),
  reference TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.student_service_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL CHECK (service_type IN ('feeding', 'extra_classes')),
  student_number TEXT,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('exemption', 'pause', 'refund', 'remittance', 'correction')),
  amount NUMERIC(12,2) DEFAULT 0 CHECK (amount IS NULL OR amount >= 0),
  effective_on DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'applied', 'rejected')),
  reason TEXT NOT NULL,
  approved_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.boarding_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  gender TEXT CHECK (gender IN ('male', 'female', 'mixed')),
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  house_parent TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.boarding_dormitories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID REFERENCES public.boarding_houses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
  occupied_count INTEGER NOT NULL DEFAULT 0 CHECK (occupied_count >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'closed')),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.boarding_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  house_id UUID REFERENCES public.boarding_houses(id) ON DELETE SET NULL,
  dormitory_id UUID REFERENCES public.boarding_dormitories(id) ON DELETE SET NULL,
  bed_label TEXT,
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'ended')),
  assigned_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.boarding_roll_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  roll_call_date DATE NOT NULL DEFAULT CURRENT_DATE,
  roll_call_time TEXT NOT NULL DEFAULT 'evening' CHECK (roll_call_time IN ('morning', 'afternoon', 'evening', 'night')),
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'exeat', 'sick_bay', 'late')),
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.boarding_exeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exeat_number TEXT NOT NULL UNIQUE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  destination TEXT NOT NULL,
  guardian_name TEXT,
  leaves_at TIMESTAMPTZ NOT NULL,
  returns_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'out', 'returned', 'cancelled')),
  approved_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (returns_at IS NULL OR returns_at >= leaves_at)
);

CREATE TABLE IF NOT EXISTS public.boarding_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT NOT NULL UNIQUE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_number TEXT,
  category TEXT NOT NULL DEFAULT 'discipline' CHECK (category IN ('discipline', 'health', 'safety', 'maintenance', 'other')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary TEXT NOT NULL,
  action_taken TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'monitoring', 'resolved', 'closed')),
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.boarding_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  student_number TEXT,
  relationship TEXT,
  visit_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('expected', 'checked_in', 'checked_out', 'blocked')),
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_staff_id_cards_status ON public.staff_id_cards(status, staff_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_id_card_verifications_code ON public.id_card_verifications(card_code, verified_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_preschool_daily_logs_date ON public.preschool_daily_logs(log_date DESC, student_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_preschool_observations_date ON public.preschool_observations(observation_date DESC, domain) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_preschool_pickups_time ON public.preschool_pickups(pickup_time DESC, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_preschool_incidents_status ON public.preschool_incidents(status, severity, occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_status ON public.cashier_sessions(status, opened_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bursary_receipts_payment_date ON public.bursary_receipts(payment_date DESC, service_type, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON public.chart_of_accounts(account_type, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(entry_date DESC, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_bills_status ON public.supplier_bills(status, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_service_enrollments_type ON public.student_service_enrollments(service_type, status, student_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_service_payments_type_date ON public.student_service_payments(service_type, payment_date DESC, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_service_adjustments_type ON public.student_service_adjustments(service_type, status, effective_on DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_boarding_assignments_status ON public.boarding_assignments(status, student_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_boarding_roll_calls_date ON public.boarding_roll_calls(roll_call_date DESC, roll_call_time, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_boarding_exeats_status ON public.boarding_exeats(status, leaves_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_boarding_incidents_status ON public.boarding_incidents(status, severity, occurred_at DESC) WHERE deleted_at IS NULL;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'staff_id_cards', 'id_card_verifications',
    'preschool_daily_logs', 'preschool_observations', 'preschool_pickups', 'preschool_incidents',
    'cashier_sessions', 'bursary_receipts',
    'chart_of_accounts', 'fiscal_years', 'journal_entries', 'journal_entry_lines', 'supplier_bills', 'bank_accounts',
    'student_service_enrollments', 'student_service_payments', 'student_service_adjustments',
    'boarding_houses', 'boarding_dormitories', 'boarding_assignments', 'boarding_roll_calls', 'boarding_exeats',
    'boarding_incidents', 'boarding_visitors'
  ]
  LOOP
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.set_updated_at()', table_name, table_name);
    EXECUTE FORMAT('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_audit ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.write_audit_log()', table_name, table_name);
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_suite_manage', table_name);
    EXECUTE FORMAT(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (private.has_role(ARRAY[''super_admin'', ''school_admin'', ''teacher'', ''hr_staff'', ''finance_officer'', ''it_support''])) WITH CHECK (private.has_role(ARRAY[''super_admin'', ''school_admin'', ''teacher'', ''hr_staff'', ''finance_officer'', ''it_support'']))',
      table_name || '_suite_manage',
      table_name
    );
  END LOOP;
END $$;
