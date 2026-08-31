-- Ensure dashboard rollup views run with the querying user's RLS context.
-- Supabase Advisor flags default SECURITY DEFINER view behavior because it can bypass RLS.

ALTER VIEW public.student_360_overview SET (security_invoker = true);
ALTER VIEW public.workflow_task_overview SET (security_invoker = true);
