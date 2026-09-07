INSERT INTO public.roles (name, display_name, description)
VALUES (
  'school_owner',
  'School Owner / Proprietor',
  'Client proprietor account with executive school-wide access.'
)
ON CONFLICT (name) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  deleted_at = NULL;

CREATE OR REPLACE FUNCTION private.has_role(role_names TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE(
    private.current_profile_role() = ANY(role_names)
    OR (
      private.current_profile_role() = 'school_owner'
      AND role_names && ARRAY['super_admin', 'school_admin']
    ),
    FALSE
  );
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
