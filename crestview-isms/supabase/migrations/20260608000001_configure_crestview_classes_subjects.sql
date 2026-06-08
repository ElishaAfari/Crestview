DO $$
DECLARE
  ay_id UUID;
  class_row RECORD;
  subject_code TEXT;
  term_name TEXT;
BEGIN
  SELECT id INTO ay_id
  FROM public.academic_years
  WHERE is_current = TRUE
    AND deleted_at IS NULL
  ORDER BY start_date DESC
  LIMIT 1;

  IF ay_id IS NULL THEN
    INSERT INTO public.academic_years (name, start_date, end_date, is_current)
    VALUES ('2025/2026', '2025-09-01', '2026-07-15', TRUE)
    ON CONFLICT (name) DO UPDATE SET is_current = TRUE
    RETURNING id INTO ay_id;
  END IF;

  INSERT INTO public.departments (name, code, description) VALUES
    ('Early Years', 'EYE', 'Nursery and kindergarten foundations'),
    ('Primary Studies', 'PRI', 'Primary school core curriculum'),
    ('Languages', 'LAN', 'English, writing, French, and literacy learning'),
    ('Mathematics', 'MTH', 'Mathematics and numeracy learning'),
    ('Creative Arts', 'ART', 'Creative arts, music, and practical expression'),
    ('Social Studies', 'SOC', 'History, citizenship, and society learning'),
    ('Religious and Moral Education', 'RME', 'Religious and moral education'),
    ('Digital Learning', 'DIG', 'Digital literacy and applied technology'),
    ('Ghanaian Languages', 'GHA', 'Ghanaian language learning')
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

  INSERT INTO public.subjects (name, code, department_id, credit_hours) VALUES
    ('Literacy', 'LITR', (SELECT id FROM public.departments WHERE code = 'EYE'), 1),
    ('Numeracy', 'NUM', (SELECT id FROM public.departments WHERE code = 'EYE'), 1),
    ('Creative Arts', 'CRA', (SELECT id FROM public.departments WHERE code = 'ART'), 1),
    ('Our World Our People', 'OWOP', (SELECT id FROM public.departments WHERE code = 'PRI'), 1),
    ('Writing', 'WRI', (SELECT id FROM public.departments WHERE code = 'LAN'), 1),
    ('Maths', 'MAT', (SELECT id FROM public.departments WHERE code = 'MTH'), 1),
    ('English', 'ENG', (SELECT id FROM public.departments WHERE code = 'LAN'), 1),
    ('Religious and Moral Education', 'RME', (SELECT id FROM public.departments WHERE code = 'RME'), 1),
    ('Digital Literacy', 'DIL', (SELECT id FROM public.departments WHERE code = 'DIG'), 1),
    ('Ghanaian Language', 'GHL', (SELECT id FROM public.departments WHERE code = 'GHA'), 1),
    ('French', 'FRE', (SELECT id FROM public.departments WHERE code = 'LAN'), 1),
    ('History', 'HIS', (SELECT id FROM public.departments WHERE code = 'SOC'), 1)
  ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name,
        department_id = EXCLUDED.department_id,
        credit_hours = EXCLUDED.credit_hours;

  FOR class_row IN
    SELECT *
    FROM (
      VALUES
        ('Nursery 1', 'Nursery 1', 'NUR-1', ARRAY['LITR','NUM','CRA']::TEXT[]),
        ('Nursery 2', 'Nursery 2', 'NUR-2', ARRAY['LITR','NUM','CRA']::TEXT[]),
        ('KG 1', 'Kindergarten 1', 'KG-1', ARRAY['LITR','NUM','CRA','OWOP','WRI']::TEXT[]),
        ('KG 2', 'Kindergarten 2', 'KG-2', ARRAY['LITR','NUM','CRA','OWOP','WRI']::TEXT[]),
        ('Primary 1', 'Primary 1', 'PRI-1', ARRAY['MAT','ENG','RME','CRA','DIL','GHL','FRE','HIS']::TEXT[]),
        ('Primary 2', 'Primary 2', 'PRI-2', ARRAY['MAT','ENG','RME','CRA','DIL','GHL','FRE','HIS']::TEXT[]),
        ('Primary 3', 'Primary 3', 'PRI-3', ARRAY['MAT','ENG','RME','CRA','DIL','GHL','FRE','HIS']::TEXT[]),
        ('Primary 4', 'Primary 4', 'PRI-4', ARRAY['MAT','ENG','RME','CRA','DIL','GHL','FRE','HIS']::TEXT[]),
        ('Primary 5', 'Primary 5', 'PRI-5', ARRAY['MAT','ENG','RME','CRA','DIL','GHL','FRE','HIS']::TEXT[]),
        ('Primary 6', 'Primary 6', 'PRI-6', ARRAY['MAT','ENG','RME','CRA','DIL','GHL','FRE','HIS']::TEXT[])
    ) AS classes(name, grade_level, room_number, subject_codes)
  LOOP
    INSERT INTO public.classrooms (name, grade_level, academic_year_id, capacity, room_number)
    VALUES (class_row.name, class_row.grade_level, ay_id, 35, class_row.room_number)
    ON CONFLICT (name, academic_year_id) DO UPDATE
      SET grade_level = EXCLUDED.grade_level,
          room_number = EXCLUDED.room_number,
          capacity = EXCLUDED.capacity,
          deleted_at = NULL;

    FOREACH term_name IN ARRAY ARRAY['Term 1', 'Term 2', 'Term 3']::TEXT[] LOOP
      FOREACH subject_code IN ARRAY class_row.subject_codes LOOP
        INSERT INTO public.courses (subject_id, classroom_id, academic_year_id, term)
        VALUES (
          (SELECT id FROM public.subjects WHERE code = subject_code),
          (SELECT id FROM public.classrooms WHERE name = class_row.name AND academic_year_id = ay_id),
          ay_id,
          term_name
        )
        ON CONFLICT (subject_id, classroom_id, academic_year_id, term) DO UPDATE
          SET deleted_at = NULL;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

WITH ranked_daily_class_attendance AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY student_id, attendance_date, classroom_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
    ) AS row_number
  FROM public.attendance_records
  WHERE course_id IS NULL
    AND deleted_at IS NULL
)
UPDATE public.attendance_records
SET deleted_at = NOW()
WHERE id IN (
  SELECT id
  FROM ranked_daily_class_attendance
  WHERE row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_daily_class_student_idx
  ON public.attendance_records(student_id, attendance_date, classroom_id)
  WHERE course_id IS NULL
    AND deleted_at IS NULL;
