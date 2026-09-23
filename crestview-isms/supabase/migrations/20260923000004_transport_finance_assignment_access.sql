-- Finance staff collect transport fares and therefore need to maintain the
-- active learner-to-route assignments that make a collection eligible.
DROP POLICY IF EXISTS student_transport_assignments_admin_manage ON public.student_transport_assignments;
CREATE POLICY student_transport_assignments_transport_manage ON public.student_transport_assignments
  FOR ALL TO authenticated
  USING (
    deleted_at IS NULL
    AND private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer', 'it_support'])
  )
  WITH CHECK (
    private.has_role(ARRAY['super_admin', 'school_admin', 'finance_officer', 'it_support'])
  );
