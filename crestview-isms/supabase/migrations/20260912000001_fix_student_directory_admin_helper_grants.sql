-- Recreating a function resets explicit function privileges in Postgres.
-- The student directory RPC calls this private helper, so keep its grants
-- and proprietor/admin role coverage intact after later function updates.
CREATE OR REPLACE FUNCTION private.require_active_administrator()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.roles r ON r.id = p.role_id
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.deleted_at IS NULL
      AND r.name IN ('super_admin', 'school_owner', 'school_admin')
      AND r.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'An active administrator account is required.' USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.require_active_administrator() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.require_active_administrator() TO authenticated, service_role;
