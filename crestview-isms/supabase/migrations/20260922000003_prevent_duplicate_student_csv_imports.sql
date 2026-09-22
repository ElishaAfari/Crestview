-- CSV source identities must be unique among active records. The application
-- also checks this before creating accounts; this index protects concurrent
-- uploads and future importer changes from creating duplicate learners.
CREATE UNIQUE INDEX IF NOT EXISTS students_import_key_unique_idx
  ON public.students ((metadata ->> 'import_key'))
  WHERE deleted_at IS NULL
    AND metadata ? 'import_key';
