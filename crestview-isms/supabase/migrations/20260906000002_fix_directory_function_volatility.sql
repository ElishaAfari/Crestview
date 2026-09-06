-- The authorization helper only reads stable profile and role state.
-- Marking it STABLE keeps the read-only directory RPC honest to the planner.
CREATE OR REPLACE FUNCTION private.require_active_administrator()
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND p.is_active = true AND p.deleted_at IS NULL
      AND r.name IN ('super_admin', 'school_admin') AND r.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'An active administrator account is required.' USING ERRCODE = '42501';
  END IF;
END;
$$;
