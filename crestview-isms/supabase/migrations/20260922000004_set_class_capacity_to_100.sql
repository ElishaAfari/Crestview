-- Crestview's current operating capacity is 100 learners per class. Apply it
-- to the active rooms that were seeded with the smaller pilot capacity and
-- make it the default for classrooms created going forward.
ALTER TABLE public.classrooms
  ALTER COLUMN capacity SET DEFAULT 100;

UPDATE public.classrooms
SET capacity = 100,
    updated_at = NOW()
WHERE deleted_at IS NULL
  AND capacity < 100;
