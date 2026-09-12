-- The directory RPC already performs an active admin/owner gate before reading
-- student records. Run it as a security-definer function so authorized
-- proprietor accounts are not filtered by table-level RLS after that gate.
ALTER FUNCTION public.search_student_directory(TEXT, TEXT, UUID, TEXT, INTEGER, INTEGER)
  SECURITY DEFINER
  SET search_path = '';

REVOKE ALL ON FUNCTION public.search_student_directory(TEXT, TEXT, UUID, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_student_directory(TEXT, TEXT, UUID, TEXT, INTEGER, INTEGER)
  TO authenticated, service_role;
