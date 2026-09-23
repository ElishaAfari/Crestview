-- Establish one predictable staff identity format and use it as the QR payload
-- on staff cards. The clocking metadata records whether a scan or typed ID was
-- used without changing historical attendance rows.
CREATE TABLE IF NOT EXISTS public.staff_number_sequence (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  next_value INTEGER NOT NULL DEFAULT 1 CHECK (next_value BETWEEN 1 AND 9999),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.staff_number_sequence ENABLE ROW LEVEL SECURITY;
INSERT INTO public.staff_number_sequence (id, next_value) VALUES (TRUE, 1)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.next_staff_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE allocated INTEGER;
BEGIN
  UPDATE public.staff_number_sequence
  SET next_value = next_value + 1, updated_at = NOW()
  WHERE id = TRUE AND next_value <= 9999
  RETURNING next_value - 1 INTO allocated;
  IF allocated IS NULL THEN RAISE EXCEPTION 'Staff number sequence is exhausted'; END IF;
  RETURN 'CIS/STA' || LPAD(allocated::TEXT, 4, '0');
END;
$$;
REVOKE ALL ON FUNCTION public.next_staff_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_staff_number() TO service_role;

ALTER TABLE public.staff_attendance_records
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB;

DO $$
DECLARE row_record RECORD;
DECLARE next_number TEXT;
BEGIN
  UPDATE public.staff_id_cards
  SET card_number = '__staff_card_migration__' || id::TEXT,
      staff_number = '__staff_number_migration__' || id::TEXT,
      qr_payload = '__staff_qr_migration__' || id::TEXT
  WHERE deleted_at IS NULL;

  FOR row_record IN
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at NULLS FIRST, id)::INTEGER AS sequence_number
    FROM public.staff_profiles WHERE deleted_at IS NULL
    ORDER BY sequence_number
  LOOP
    next_number := 'CIS/STA' || LPAD(row_record.sequence_number::TEXT, 4, '0');
    UPDATE public.staff_profiles SET staff_number = next_number, updated_at = NOW() WHERE id = row_record.id;
    UPDATE public.staff_id_cards
    SET status = 'reissued', updated_at = NOW()
    WHERE staff_profile_id = row_record.id
      AND deleted_at IS NULL
      AND id <> COALESCE((
        SELECT id FROM public.staff_id_cards
        WHERE staff_profile_id = row_record.id AND deleted_at IS NULL
        ORDER BY issued_at DESC NULLS LAST, id DESC
        LIMIT 1
      ), '00000000-0000-0000-0000-000000000000'::UUID);
    UPDATE public.staff_id_cards
    SET staff_number = next_number,
        card_number = 'STAFF-CARD-' || next_number,
        qr_payload = next_number,
        status = 'active',
        updated_at = NOW()
    WHERE id = (
      SELECT id FROM public.staff_id_cards
      WHERE staff_profile_id = row_record.id AND deleted_at IS NULL
      ORDER BY issued_at DESC NULLS LAST, id DESC
      LIMIT 1
    );
  END LOOP;

  UPDATE public.staff_number_sequence
  SET next_value = COALESCE((SELECT COUNT(*) + 1 FROM public.staff_profiles WHERE deleted_at IS NULL), 1), updated_at = NOW()
  WHERE id = TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION private.ensure_active_staff_id_card()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
  UPDATE public.staff_id_cards
  SET status = 'reissued', updated_at = NOW()
  WHERE staff_profile_id = NEW.id
    AND deleted_at IS NULL
    AND id <> COALESCE((
      SELECT id FROM public.staff_id_cards
      WHERE staff_profile_id = NEW.id AND deleted_at IS NULL
      ORDER BY issued_at DESC NULLS LAST, id DESC
      LIMIT 1
    ), '00000000-0000-0000-0000-000000000000'::UUID);
  UPDATE public.staff_id_cards
  SET staff_number = NEW.staff_number,
      card_number = 'STAFF-CARD-' || NEW.staff_number,
      qr_payload = NEW.staff_number,
      status = 'active',
      updated_at = NOW()
  WHERE id = (
    SELECT id FROM public.staff_id_cards
    WHERE staff_profile_id = NEW.id AND deleted_at IS NULL
    ORDER BY issued_at DESC NULLS LAST, id DESC
    LIMIT 1
  );

  IF NOT FOUND THEN
    INSERT INTO public.staff_id_cards (staff_profile_id, profile_id, card_number, staff_number, qr_payload, status, metadata)
    VALUES (NEW.id, NEW.profile_id, 'STAFF-CARD-' || NEW.staff_number, NEW.staff_number, NEW.staff_number, 'active', jsonb_build_object('source', 'staff_profile_trigger'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_active_staff_id_card_trigger ON public.staff_profiles;
CREATE TRIGGER ensure_active_staff_id_card_trigger
AFTER INSERT OR UPDATE OF staff_number ON public.staff_profiles
FOR EACH ROW EXECUTE FUNCTION private.ensure_active_staff_id_card();

INSERT INTO public.staff_id_cards (staff_profile_id, profile_id, card_number, staff_number, qr_payload, status, metadata)
SELECT sp.id, sp.profile_id, 'STAFF-CARD-' || sp.staff_number, sp.staff_number, sp.staff_number, 'active', jsonb_build_object('source', 'staff_id_backfill')
FROM public.staff_profiles sp
WHERE sp.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.staff_id_cards c WHERE c.staff_profile_id = sp.id AND c.deleted_at IS NULL);
