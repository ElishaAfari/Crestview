-- Move the canonical student identifier from Stu000001 to CIS/ST/000001.

CREATE OR REPLACE FUNCTION public.next_student_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allocated INTEGER;
BEGIN
  UPDATE public.student_number_sequence
  SET next_value = next_value + 1, updated_at = NOW()
  WHERE id = TRUE AND next_value <= 999999
  RETURNING next_value - 1 INTO allocated;

  IF allocated IS NULL THEN
    RAISE EXCEPTION 'Student number sequence is exhausted';
  END IF;

  RETURN 'CIS/ST/' || LPAD(allocated::TEXT, 6, '0');
END;
$$;

DO $$
DECLARE
  student_row RECORD;
  table_row RECORD;
  old_student_number TEXT;
  new_student_number TEXT;
BEGIN
  CREATE TEMP TABLE student_number_cis_migration ON COMMIT DROP AS
    SELECT id, student_number AS source_student_number,
      ROW_NUMBER() OVER (ORDER BY created_at NULLS FIRST, id)::INTEGER AS sequence_number
    FROM public.students
    WHERE deleted_at IS NULL;

  UPDATE public.students AS s
  SET student_number = '__cis_student_number_migration__' || s.id::TEXT
  FROM student_number_cis_migration AS m
  WHERE s.id = m.id;

  FOR student_row IN
    SELECT id, source_student_number, sequence_number
    FROM student_number_cis_migration
    ORDER BY sequence_number
  LOOP
    old_student_number := student_row.source_student_number;
    new_student_number := 'CIS/ST/' || LPAD(student_row.sequence_number::TEXT, 6, '0');

    UPDATE public.students
    SET student_number = new_student_number,
        metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
          'legacy_student_number', old_student_number,
          'student_number_format_migrated_at', NOW()
        )
    WHERE id = student_row.id;

    FOR table_row IN
      SELECT c.table_schema, c.table_name
      FROM information_schema.columns AS c
      JOIN information_schema.tables AS t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'student_number'
        AND c.table_name <> 'students'
        AND t.table_type = 'BASE TABLE'
    LOOP
      EXECUTE FORMAT('UPDATE %I.%I SET student_number = $1 WHERE student_number = $2', table_row.table_schema, table_row.table_name)
      USING new_student_number, old_student_number;
    END LOOP;

    UPDATE public.student_id_cards
    SET qr_payload = new_student_number
    WHERE student_id = student_row.id;
  END LOOP;

  UPDATE public.student_number_sequence
  SET next_value = COALESCE((SELECT MAX(sequence_number) + 1 FROM student_number_cis_migration), 1), updated_at = NOW()
  WHERE id = TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.student_qr_payload(student_number TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT TRIM(student_number);
$$;
