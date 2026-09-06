-- Dedicated student directory and transactional end-of-year promotions.
CREATE TABLE public.promotion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 3 AND 120),
  source_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  target_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (source_year_id <> target_year_id)
);

CREATE TABLE public.promotion_run_students (
  run_id UUID NOT NULL REFERENCES public.promotion_runs(id),
  student_id UUID NOT NULL REFERENCES public.students(id),
  source_classroom_id UUID NOT NULL REFERENCES public.classrooms(id),
  target_classroom_id UUID REFERENCES public.classrooms(id),
  outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending', 'promoted', 'excluded')),
  PRIMARY KEY (run_id, student_id)
);

ALTER TABLE public.promotion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_run_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY promotion_runs_admin_read ON public.promotion_runs FOR SELECT TO authenticated
  USING (private.is_admin());
CREATE POLICY promotion_run_students_admin_read ON public.promotion_run_students FOR SELECT TO authenticated
  USING (private.is_admin());
REVOKE ALL ON public.promotion_runs, public.promotion_run_students FROM anon, authenticated;
GRANT SELECT ON public.promotion_runs, public.promotion_run_students TO authenticated;
GRANT ALL ON public.promotion_runs, public.promotion_run_students TO service_role;

CREATE OR REPLACE FUNCTION private.require_active_administrator()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
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

CREATE OR REPLACE FUNCTION public.search_student_directory(
  p_search TEXT DEFAULT '', p_status TEXT DEFAULT 'active', p_classroom UUID DEFAULT NULL,
  p_gender TEXT DEFAULT '', p_page INTEGER DEFAULT 1, p_page_size INTEGER DEFAULT 20
) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_result JSONB;
BEGIN
  PERFORM private.require_active_administrator();
  IF p_page < 1 OR p_page_size NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Invalid page size or page number.';
  END IF;
  WITH directory AS (
    SELECT s.id, s.student_number, s.status, s.classroom_id,
      concat_ws(' ', p.first_name, nullif(p.middle_name, ''), p.last_name) AS name,
      p.gender, p.date_of_birth, c.name AS classroom, c.grade_level
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id AND p.deleted_at IS NULL
    LEFT JOIN public.classrooms c ON c.id = s.classroom_id AND c.deleted_at IS NULL
    WHERE s.deleted_at IS NULL
  ), filtered AS (
    SELECT * FROM directory d WHERE (p_status = '' OR d.status = p_status)
      AND (p_classroom IS NULL OR d.classroom_id = p_classroom)
      AND (p_gender = '' OR d.gender = p_gender)
      AND (trim(p_search) = '' OR strpos(lower(d.name || ' ' || d.student_number), lower(trim(p_search))) > 0)
  ), page AS (
    SELECT * FROM filtered ORDER BY lower(name), id
    LIMIT p_page_size OFFSET ((p_page::bigint - 1) * p_page_size)
  )
  SELECT jsonb_build_object(
    'students', COALESCE((SELECT jsonb_agg(to_jsonb(page) ORDER BY lower(name), id) FROM page), '[]'::jsonb),
    'total', (SELECT count(*) FROM filtered),
    'stats', (SELECT jsonb_build_object('total', count(*),
      'active', count(*) FILTER (WHERE status = 'active'),
      'graduated', count(*) FILTER (WHERE status = 'graduated'),
      'inactive', count(*) FILTER (WHERE status IN ('withdrawn', 'suspended')),
      'male', count(*) FILTER (WHERE gender = 'male'),
      'female', count(*) FILTER (WHERE gender = 'female')) FROM directory)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_promotion_run(p_name TEXT, p_source_year UUID, p_target_year UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id UUID;
BEGIN
  PERFORM private.require_active_administrator();
  IF NOT EXISTS (
    SELECT 1 FROM public.academic_years s, public.academic_years t
    WHERE s.id = p_source_year AND t.id = p_target_year AND t.start_date > s.end_date
      AND s.deleted_at IS NULL AND t.deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'Choose a target academic year after the source year.'; END IF;
  INSERT INTO public.promotion_runs(name, source_year_id, target_year_id, created_by)
    VALUES (trim(p_name), p_source_year, p_target_year, auth.uid()) RETURNING id INTO v_id;
  INSERT INTO public.promotion_run_students(run_id, student_id, source_classroom_id)
    SELECT v_id, s.id, s.classroom_id FROM public.students s
    JOIN public.classrooms c ON c.id = s.classroom_id
    WHERE c.academic_year_id = p_source_year AND c.deleted_at IS NULL
      AND s.status = 'active' AND s.deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'There are no active students in the source academic year.'; END IF;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_promotion_run(
  p_run UUID, p_mappings JSONB, p_excluded UUID[] DEFAULT '{}'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_run public.promotion_runs%ROWTYPE;
  v_count INTEGER;
  v_group RECORD;
  v_batch UUID;
  v_class UUID;
BEGIN
  PERFORM private.require_active_administrator();
  SELECT * INTO v_run FROM public.promotion_runs WHERE id = p_run FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Promotion batch not found.'; END IF;
  -- The run lock also makes a retried submission return its original result.
  IF v_run.status = 'completed' THEN
    RETURN jsonb_build_object('count', (SELECT count(*) FROM public.promotion_run_students WHERE run_id = p_run AND outcome = 'promoted'), 'alreadyCompleted', true);
  END IF;
  IF v_run.status <> 'draft' THEN RAISE EXCEPTION 'Only draft batches can be completed.'; END IF;
  IF p_mappings IS NULL OR jsonb_typeof(p_mappings) <> 'object' OR p_excluded IS NULL
    OR array_position(p_excluded, NULL) IS NOT NULL THEN RAISE EXCEPTION 'Invalid class mappings or excluded students.'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_excluded) e(id) WHERE NOT EXISTS (
    SELECT 1 FROM public.promotion_run_students i WHERE i.run_id = p_run AND i.student_id = e.id
  )) THEN RAISE EXCEPTION 'Excluded students must belong to this batch.'; END IF;

  UPDATE public.promotion_run_students i SET
    target_classroom_id = CASE WHEN i.student_id = ANY(p_excluded) THEN NULL
      ELSE nullif(p_mappings ->> i.source_classroom_id::text, '')::uuid END,
    outcome = CASE WHEN i.student_id = ANY(p_excluded) THEN 'excluded' ELSE 'pending' END
    WHERE i.run_id = p_run;
  IF EXISTS (SELECT 1 FROM public.promotion_run_students i
    LEFT JOIN public.classrooms c ON c.id = i.target_classroom_id
    WHERE i.run_id = p_run AND i.outcome = 'pending' AND
      (c.id IS NULL OR c.academic_year_id IS DISTINCT FROM v_run.target_year_id OR c.deleted_at IS NOT NULL)
  ) THEN RAISE EXCEPTION 'Map every included class to a class in the target academic year.'; END IF;

  -- Stable lock order serializes overlapping batches and capacity checks.
  PERFORM c.id FROM public.classrooms c WHERE c.id IN (
    SELECT source_classroom_id FROM public.promotion_run_students WHERE run_id = p_run
    UNION SELECT target_classroom_id FROM public.promotion_run_students WHERE run_id = p_run
  ) ORDER BY c.id FOR UPDATE;
  PERFORM s.id FROM public.students s JOIN public.promotion_run_students i ON i.student_id = s.id
    WHERE i.run_id = p_run AND i.outcome = 'pending' ORDER BY s.id FOR UPDATE OF s;
  IF EXISTS (
    SELECT 1 FROM public.promotion_run_students i JOIN public.students s ON s.id = i.student_id
    JOIN public.classrooms c ON c.id = i.source_classroom_id
    WHERE i.run_id = p_run AND i.outcome = 'pending' AND
      (s.classroom_id IS DISTINCT FROM i.source_classroom_id OR s.status <> 'active' OR s.deleted_at IS NOT NULL
       OR c.academic_year_id IS DISTINCT FROM v_run.source_year_id OR c.deleted_at IS NOT NULL)
  ) THEN RAISE EXCEPTION 'A student or source class changed after this batch was created. Create a fresh batch.'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.promotion_run_students i JOIN public.classrooms c ON c.id = i.target_classroom_id
    WHERE i.run_id = p_run AND i.outcome = 'pending' GROUP BY c.id, c.capacity
    HAVING count(*) + (SELECT count(*) FROM public.students s WHERE s.classroom_id = c.id
      AND s.status = 'active' AND s.deleted_at IS NULL) > c.capacity
  ) THEN RAISE EXCEPTION 'A destination class does not have enough capacity.'; END IF;
  SELECT count(*) INTO v_count FROM public.promotion_run_students WHERE run_id = p_run AND outcome = 'pending';
  IF v_count = 0 THEN RAISE EXCEPTION 'Include at least one student.'; END IF;

  FOR v_group IN SELECT source_classroom_id, target_classroom_id, count(*) AS total
    FROM public.promotion_run_students WHERE run_id = p_run AND outcome = 'pending'
    GROUP BY source_classroom_id, target_classroom_id
  LOOP
    INSERT INTO public.class_promotion_batches(batch_number, from_classroom_id, to_classroom_id,
      academic_year_id, promoted_by, student_count, notes, metadata)
    VALUES ('PROMO-' || gen_random_uuid()::text, v_group.source_classroom_id, v_group.target_classroom_id,
      v_run.target_year_id, auth.uid(), v_group.total, v_run.name, jsonb_build_object('run_id', p_run)) RETURNING id INTO v_batch;
    INSERT INTO public.student_promotion_records(promotion_batch_id, student_id, from_classroom_id, to_classroom_id, previous_status, promoted_by)
      SELECT v_batch, student_id, source_classroom_id, target_classroom_id, 'active', auth.uid()
      FROM public.promotion_run_students WHERE run_id = p_run AND outcome = 'pending' AND source_classroom_id = v_group.source_classroom_id;
  END LOOP;

  -- Preserve historical enrollment, grades, attendance and fees under their original class.
  UPDATE public.student_enrollments e SET status = 'promoted', exited_on = greatest(current_date, e.enrolled_on)
    FROM public.promotion_run_students i WHERE i.run_id = p_run AND i.outcome = 'pending'
      AND e.student_id = i.student_id AND e.status = 'active' AND e.deleted_at IS NULL;
  INSERT INTO public.student_enrollments(student_id, classroom_id, academic_year_id, notes)
    SELECT student_id, target_classroom_id, v_run.target_year_id, v_run.name
    FROM public.promotion_run_students WHERE run_id = p_run AND outcome = 'pending';
  UPDATE public.students s SET classroom_id = i.target_classroom_id
    FROM public.promotion_run_students i WHERE i.run_id = p_run AND i.outcome = 'pending' AND s.id = i.student_id;
  INSERT INTO public.account_lifecycle_records(profile_id, student_id, action, reason, performed_by, snapshot)
    SELECT s.profile_id, s.id, 'promoted', v_run.name, auth.uid(),
      jsonb_build_object('run_id', p_run, 'from_classroom_id', i.source_classroom_id, 'to_classroom_id', i.target_classroom_id)
    FROM public.promotion_run_students i JOIN public.students s ON s.id = i.student_id
    WHERE i.run_id = p_run AND i.outcome = 'pending';
  INSERT INTO public.notifications(recipient_id, title, body, type, metadata)
    SELECT DISTINCT recipients.profile_id, 'Class placement updated', 'Your school has updated a student class placement.', 'info',
      jsonb_build_object('student_id', i.student_id, 'run_id', p_run)
    FROM public.promotion_run_students i
    JOIN LATERAL (
      SELECT s.profile_id FROM public.students s WHERE s.id = i.student_id
      UNION SELECT ps.parent_profile_id FROM public.parent_students ps WHERE ps.student_id = i.student_id AND ps.deleted_at IS NULL
    ) recipients ON true WHERE i.run_id = p_run AND i.outcome = 'pending';
  FOR v_class IN SELECT source_classroom_id FROM public.promotion_run_students WHERE run_id = p_run AND outcome = 'pending'
    UNION SELECT target_classroom_id FROM public.promotion_run_students WHERE run_id = p_run AND outcome = 'pending'
  LOOP
    INSERT INTO public.class_roster_snapshots(classroom_id, academic_year_id, captured_by, snapshot_type, student_count, roster, notes)
      SELECT c.id, c.academic_year_id, auth.uid(), 'promotion', count(s.id),
        COALESCE(jsonb_agg(jsonb_build_object('id', s.id, 'studentNumber', s.student_number)) FILTER (WHERE s.id IS NOT NULL), '[]'::jsonb), v_run.name
      FROM public.classrooms c LEFT JOIN public.students s ON s.classroom_id = c.id AND s.status = 'active' AND s.deleted_at IS NULL
      WHERE c.id = v_class GROUP BY c.id;
  END LOOP;
  UPDATE public.promotion_run_students SET outcome = 'promoted' WHERE run_id = p_run AND outcome = 'pending';
  UPDATE public.promotion_runs SET status = 'completed', completed_at = now() WHERE id = p_run;
  RETURN jsonb_build_object('count', v_count, 'alreadyCompleted', false);
END;
$$;

REVOKE ALL ON FUNCTION private.require_active_administrator() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.require_active_administrator() TO authenticated;
REVOKE ALL ON FUNCTION public.search_student_directory(TEXT,TEXT,UUID,TEXT,INTEGER,INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_promotion_run(TEXT,UUID,UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_promotion_run(UUID,JSONB,UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_student_directory(TEXT,TEXT,UUID,TEXT,INTEGER,INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_promotion_run(TEXT,UUID,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_promotion_run(UUID,JSONB,UUID[]) TO authenticated;
