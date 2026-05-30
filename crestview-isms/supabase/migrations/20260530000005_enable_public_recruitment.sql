DROP POLICY IF EXISTS job_postings_public_read ON public.job_postings;
CREATE POLICY job_postings_public_read ON public.job_postings
  FOR SELECT TO anon, authenticated
  USING (
    is_active = TRUE
    AND deleted_at IS NULL
    AND (closes_on IS NULL OR closes_on >= CURRENT_DATE)
  );
