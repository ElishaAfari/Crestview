-- Transport fares are deliberately separate from tuition and daily-fee records.
-- This keeps route collection, receipt history, and guardian visibility auditable.

CREATE TABLE IF NOT EXISTS public.transport_fare_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'GHS',
  collection_frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (collection_frequency IN ('daily', 'weekly', 'monthly', 'termly')),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_transport_fare_plans_active_route
  ON public.transport_fare_plans(route_id, effective_from DESC)
  WHERE deleted_at IS NULL AND is_active = TRUE;

CREATE TABLE IF NOT EXISTS public.transport_fare_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.student_transport_assignments(id) ON DELETE SET NULL,
  route_id UUID REFERENCES public.transport_routes(id) ON DELETE SET NULL,
  fare_plan_id UUID REFERENCES public.transport_fare_plans(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  collection_period TEXT NOT NULL,
  student_number TEXT NOT NULL,
  qr_payload TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'GHS',
  method TEXT NOT NULL DEFAULT 'cash'
    CHECK (method IN ('cash', 'mobile_money', 'card', 'bank', 'other')),
  status TEXT NOT NULL DEFAULT 'paid'
    CHECK (status IN ('paid', 'waived', 'reversed')),
  reference TEXT NOT NULL UNIQUE,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS transport_fare_payments_one_active_per_period_idx
  ON public.transport_fare_payments(student_id, collection_period)
  WHERE deleted_at IS NULL AND status IN ('paid', 'waived');

CREATE INDEX IF NOT EXISTS idx_transport_fare_payments_date_route
  ON public.transport_fare_payments(payment_date DESC, route_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transport_fare_payments_student
  ON public.transport_fare_payments(student_id, payment_date DESC)
  WHERE deleted_at IS NULL;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['transport_fare_plans', 'transport_fare_payments']
  LOOP
    EXECUTE FORMAT('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.set_updated_at()', table_name, table_name);
    EXECUTE FORMAT('DROP TRIGGER IF EXISTS trg_%I_audit ON public.%I', table_name, table_name);
    EXECUTE FORMAT('CREATE TRIGGER trg_%I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.write_audit_log()', table_name, table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS transport_fare_plans_member_read ON public.transport_fare_plans;
CREATE POLICY transport_fare_plans_member_read ON public.transport_fare_plans
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND private.is_finance_staff());

DROP POLICY IF EXISTS transport_fare_plans_finance_manage ON public.transport_fare_plans;
CREATE POLICY transport_fare_plans_finance_manage ON public.transport_fare_plans
  FOR ALL TO authenticated
  USING (private.is_finance_staff())
  WITH CHECK (private.is_finance_staff());

DROP POLICY IF EXISTS transport_fare_payments_member_read ON public.transport_fare_payments;
CREATE POLICY transport_fare_payments_member_read ON public.transport_fare_payments
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (private.is_finance_staff() OR private.can_access_student(student_id)));

DROP POLICY IF EXISTS transport_fare_payments_finance_manage ON public.transport_fare_payments;
CREATE POLICY transport_fare_payments_finance_manage ON public.transport_fare_payments
  FOR ALL TO authenticated
  USING (private.is_finance_staff())
  WITH CHECK (private.is_finance_staff());
