-- Daily registers are immutable to ordinary authenticated users once the day
-- has passed. Service-role actions remain available for controlled migration
-- and recovery work, while the application additionally restricts historical
-- corrections to the proprietor and super-admin roles.
CREATE OR REPLACE FUNCTION private.enforce_daily_register_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NEW.attendance_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Attendance cannot be recorded for a future date';
  END IF;

  IF auth.uid() IS NOT NULL
     AND NEW.attendance_date < CURRENT_DATE
     AND NOT private.has_role(ARRAY['super_admin', 'school_owner']) THEN
    RAISE EXCEPTION 'Only the school owner or super admin can correct a past register';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_staff_attendance_date ON public.staff_attendance_records;
CREATE TRIGGER enforce_staff_attendance_date
BEFORE INSERT OR UPDATE OF attendance_date, clock_in_at, clock_out_at, status
ON public.staff_attendance_records
FOR EACH ROW EXECUTE FUNCTION private.enforce_daily_register_date();

DROP TRIGGER IF EXISTS enforce_student_attendance_date ON public.attendance_records;
CREATE TRIGGER enforce_student_attendance_date
BEFORE INSERT OR UPDATE OF attendance_date, status, notes
ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION private.enforce_daily_register_date();
