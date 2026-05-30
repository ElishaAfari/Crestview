CREATE TABLE IF NOT EXISTS public.portal_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'revoked', 'expired')),
  invited_by UUID REFERENCES public.profiles(id),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  accepted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_portal_invitations_email ON public.portal_invitations(email);
CREATE INDEX IF NOT EXISTS idx_portal_invitations_status ON public.portal_invitations(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_invitations_pending_unique
  ON public.portal_invitations(LOWER(email))
  WHERE deleted_at IS NULL AND status = 'invited';

ALTER TABLE public.portal_invitations ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_portal_invitations_updated_at ON public.portal_invitations;
CREATE TRIGGER trg_portal_invitations_updated_at
  BEFORE UPDATE ON public.portal_invitations
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS trg_portal_invitations_audit ON public.portal_invitations;
CREATE TRIGGER trg_portal_invitations_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.portal_invitations
  FOR EACH ROW EXECUTE FUNCTION private.write_audit_log();

DROP POLICY IF EXISTS portal_invitations_admin_manage ON public.portal_invitations;
CREATE POLICY portal_invitations_admin_manage ON public.portal_invitations
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
