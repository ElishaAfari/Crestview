-- Standardize student identifiers as Stu000001, Stu000002, ...
-- Preserve each previous identifier in student metadata for audit and reconciliation.

CREATE TABLE IF NOT EXISTS public.student_number_sequence (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  next_value INTEGER NOT NULL DEFAULT 1 CHECK (next_value BETWEEN 1 AND 999999),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_number_sequence ENABLE ROW LEVEL SECURITY;

INSERT INTO public.student_number_sequence (id, next_value)
VALUES (TRUE, 1)
ON CONFLICT (id) DO NOTHING;

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

  RETURN 'Stu' || LPAD(allocated::TEXT, 6, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_student_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_student_number() TO service_role;

DO $$
DECLARE
  student_row RECORD;
  old_student_number TEXT;
  new_number TEXT;
  table_row RECORD;
BEGIN
  CREATE TEMP TABLE student_number_migration ON COMMIT DROP AS
    SELECT id, student_number AS source_student_number,
      ROW_NUMBER() OVER (ORDER BY created_at NULLS FIRST, id)::INTEGER AS sequence_number
    FROM public.students
    WHERE deleted_at IS NULL;

  -- Move current values out of the destination namespace before assigning the
  -- sequential IDs, avoiding collisions with any already-standardized rows.
  UPDATE public.students AS s
  SET student_number = '__student_number_migration__' || s.id::TEXT
  FROM student_number_migration AS m
  WHERE s.id = m.id;

  -- Card numbers are unique, and stale cards may still occupy a destination
  -- value, so move every card aside and restore unlinked cards afterwards.
  CREATE TEMP TABLE student_card_number_backup ON COMMIT DROP AS
    SELECT id, card_number FROM public.student_id_cards;
  UPDATE public.student_id_cards AS c
  SET card_number = '__student_card_migration__' || c.id::TEXT;

  FOR student_row IN SELECT id, source_student_number, sequence_number FROM student_number_migration ORDER BY sequence_number LOOP
    old_student_number := student_row.source_student_number;
    new_number := 'Stu' || LPAD(student_row.sequence_number::TEXT, 6, '0');

    UPDATE public.students
    SET student_number = new_number,
        metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
          'legacy_student_number', old_student_number,
          'student_number_migrated_at', NOW()
        )
    WHERE id = student_row.id;

    -- Update every public register that denormalizes student_number.
    FOR table_row IN
      SELECT table_schema, table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'student_number'
        AND table_name <> 'students'
        AND (table_schema, table_name) IN (
          SELECT table_schema, table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        )
    LOOP
      EXECUTE FORMAT('UPDATE %I.%I SET student_number = $1 WHERE student_number = $2', table_row.table_schema, table_row.table_name)
      USING new_number, old_student_number;
    END LOOP;

    UPDATE public.student_id_cards
    SET student_number = new_number,
        card_number = 'CARD-' || new_number,
        qr_payload = new_number,
        metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object('legacy_student_number', old_student_number)
    WHERE student_id = student_row.id;

  END LOOP;

  UPDATE public.student_id_cards AS c
  SET card_number = b.card_number
  FROM student_card_number_backup AS b
  WHERE c.id = b.id AND c.card_number LIKE '__student_card_migration__%';

  UPDATE public.student_number_sequence
  SET next_value = COALESCE((SELECT MAX(sequence_number) + 1 FROM student_number_migration), 1), updated_at = NOW()
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
