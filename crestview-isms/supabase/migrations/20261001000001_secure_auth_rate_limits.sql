-- One-time Supabase links expire according to the Auth service configuration.
-- Keep the portal status record aligned with the standard one-day access window.
ALTER TABLE public.portal_invitations
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '24 hours');

CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_hash TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'password_reset', 'parent_access', 'staff_invite', 'access_resend')),
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subject_hash, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_expiry
  ON public.auth_rate_limits (window_start);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_auth_rate_limit(
  p_subject_hash TEXT,
  p_action TEXT,
  p_window_start TIMESTAMPTZ,
  p_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_limit < 1 OR p_subject_hash = '' THEN
    RAISE EXCEPTION 'Invalid authentication rate limit input';
  END IF;

  INSERT INTO public.auth_rate_limits (
    subject_hash,
    action,
    window_start,
    request_count,
    updated_at
  )
  VALUES (p_subject_hash, p_action, p_window_start, 1, NOW())
  ON CONFLICT (subject_hash, action, window_start)
  DO UPDATE SET
    request_count = public.auth_rate_limits.request_count + 1,
    updated_at = NOW()
  WHERE public.auth_rate_limits.request_count < p_limit;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_auth_rate_limit(TEXT, TEXT, TIMESTAMPTZ, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_auth_rate_limit(TEXT, TEXT, TIMESTAMPTZ, INTEGER) TO service_role;
