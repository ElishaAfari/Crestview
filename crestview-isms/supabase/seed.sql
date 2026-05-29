INSERT INTO public.roles (name, display_name, description) VALUES
  ('super_admin', 'Super Admin', 'Unrestricted platform administrator'),
  ('school_admin', 'School Admin', 'School-wide administrative access'),
  ('teacher', 'Teacher', 'Classroom and academic delivery'),
  ('student', 'Student', 'Learner portal access'),
  ('parent', 'Parent', 'Guardian portal access'),
  ('hr_staff', 'HR Staff', 'Recruitment and payroll operations'),
  ('finance_officer', 'Finance Officer', 'Fees, invoices, and payments'),
  ('librarian', 'Librarian', 'Library and resource management'),
  ('it_support', 'IT Support', 'Technical support and system health')
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description;

INSERT INTO public.permissions (name, description, module) VALUES
  ('students:read', 'Read student records', 'students'),
  ('students:write', 'Create and update student records', 'students'),
  ('staff:read', 'Read staff records', 'staff'),
  ('staff:write', 'Create and update staff records', 'staff'),
  ('grades:read', 'Read grade records', 'grades'),
  ('grades:write', 'Create and publish grade records', 'grades'),
  ('attendance:read', 'Read attendance records', 'attendance'),
  ('attendance:write', 'Record attendance', 'attendance'),
  ('fees:read', 'Read finance records', 'finance'),
  ('fees:write', 'Manage invoices and payments', 'finance'),
  ('payroll:manage', 'Manage payroll', 'payroll'),
  ('admissions:manage', 'Manage admissions', 'admissions'),
  ('recruitment:manage', 'Manage recruitment', 'recruitment'),
  ('reports:read', 'Read reports', 'reports'),
  ('reports:write', 'Generate reports', 'reports'),
  ('ai:use', 'Use AI features', 'ai'),
  ('settings:manage', 'Manage school settings', 'settings')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, module = EXCLUDED.module;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN (
  'students:read', 'students:write', 'staff:read', 'grades:read', 'attendance:read',
  'fees:read', 'admissions:manage', 'reports:read', 'reports:write', 'settings:manage'
)
WHERE r.name = 'school_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN ('students:read', 'grades:read', 'grades:write', 'attendance:read', 'attendance:write', 'reports:read', 'ai:use')
WHERE r.name = 'teacher'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN ('grades:read', 'attendance:read', 'reports:read', 'ai:use')
WHERE r.name IN ('student', 'parent')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN ('staff:read', 'staff:write', 'payroll:manage', 'recruitment:manage')
WHERE r.name = 'hr_staff'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN ('fees:read', 'fees:write', 'payroll:manage', 'reports:read')
WHERE r.name = 'finance_officer'
ON CONFLICT DO NOTHING;

INSERT INTO public.academic_years (name, start_date, end_date, is_current) VALUES
  ('2023/2024', '2023-09-01', '2024-07-15', FALSE),
  ('2024/2025', '2024-09-01', '2025-07-15', FALSE),
  ('2025/2026', '2025-09-01', '2026-07-15', TRUE),
  ('2026/2027', '2026-09-01', '2027-07-15', FALSE)
ON CONFLICT (name) DO UPDATE SET start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, is_current = EXCLUDED.is_current;

INSERT INTO public.departments (name, code, description) VALUES
  ('Science', 'SCI', 'Biology, chemistry, physics, and applied science'),
  ('Arts', 'ART', 'Creative and performing arts'),
  ('Mathematics', 'MTH', 'Mathematics and quantitative reasoning'),
  ('Languages', 'LAN', 'English and world languages'),
  ('Social Studies', 'SOC', 'Humanities and civic education'),
  ('Physical Education', 'PHE', 'Physical education and wellbeing')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.subjects (name, code, department_id, credit_hours) VALUES
  ('Biology', 'BIO', (SELECT id FROM public.departments WHERE code = 'SCI'), 3),
  ('Chemistry', 'CHE', (SELECT id FROM public.departments WHERE code = 'SCI'), 3),
  ('Physics', 'PHY', (SELECT id FROM public.departments WHERE code = 'SCI'), 3),
  ('Integrated Science', 'ISC', (SELECT id FROM public.departments WHERE code = 'SCI'), 2),
  ('Visual Arts', 'VAR', (SELECT id FROM public.departments WHERE code = 'ART'), 2),
  ('Music', 'MUS', (SELECT id FROM public.departments WHERE code = 'ART'), 2),
  ('Drama', 'DRA', (SELECT id FROM public.departments WHERE code = 'ART'), 2),
  ('Mathematics', 'MAT', (SELECT id FROM public.departments WHERE code = 'MTH'), 4),
  ('Further Mathematics', 'FMT', (SELECT id FROM public.departments WHERE code = 'MTH'), 4),
  ('Statistics', 'STA', (SELECT id FROM public.departments WHERE code = 'MTH'), 2),
  ('English Language', 'ENG', (SELECT id FROM public.departments WHERE code = 'LAN'), 4),
  ('Literature', 'LIT', (SELECT id FROM public.departments WHERE code = 'LAN'), 3),
  ('French', 'FRE', (SELECT id FROM public.departments WHERE code = 'LAN'), 2),
  ('Spanish', 'SPA', (SELECT id FROM public.departments WHERE code = 'LAN'), 2),
  ('History', 'HIS', (SELECT id FROM public.departments WHERE code = 'SOC'), 3),
  ('Geography', 'GEO', (SELECT id FROM public.departments WHERE code = 'SOC'), 3),
  ('Civic Education', 'CIV', (SELECT id FROM public.departments WHERE code = 'SOC'), 2),
  ('Economics', 'ECO', (SELECT id FROM public.departments WHERE code = 'SOC'), 3),
  ('Physical Education', 'PED', (SELECT id FROM public.departments WHERE code = 'PHE'), 2),
  ('Health Science', 'HES', (SELECT id FROM public.departments WHERE code = 'PHE'), 2)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, department_id = EXCLUDED.department_id, credit_hours = EXCLUDED.credit_hours;

DO $$
DECLARE
  admin_id UUID := '00000000-0000-4000-8000-000000000001';
  teacher_one UUID := '00000000-0000-4000-8000-000000000101';
  teacher_two UUID := '00000000-0000-4000-8000-000000000102';
  teacher_three UUID := '00000000-0000-4000-8000-000000000103';
  parent_one UUID := '00000000-0000-4000-8000-000000000201';
  parent_two UUID := '00000000-0000-4000-8000-000000000202';
  parent_three UUID := '00000000-0000-4000-8000-000000000203';
  user_ids UUID[] := ARRAY[
    admin_id, teacher_one, teacher_two, teacher_three,
    parent_one, parent_two, parent_three,
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000302',
    '00000000-0000-4000-8000-000000000303',
    '00000000-0000-4000-8000-000000000304',
    '00000000-0000-4000-8000-000000000305',
    '00000000-0000-4000-8000-000000000306',
    '00000000-0000-4000-8000-000000000307',
    '00000000-0000-4000-8000-000000000308',
    '00000000-0000-4000-8000-000000000309',
    '00000000-0000-4000-8000-000000000310'
  ];
  emails TEXT[] := ARRAY[
    'admin@crestview.edu', 'ada.okoro@crestview.edu', 'marcus.lee@crestview.edu', 'sophia.mensah@crestview.edu',
    'parent1@example.com', 'parent2@example.com', 'parent3@example.com',
    'student1@crestview.edu', 'student2@crestview.edu', 'student3@crestview.edu', 'student4@crestview.edu',
    'student5@crestview.edu', 'student6@crestview.edu', 'student7@crestview.edu', 'student8@crestview.edu',
    'student9@crestview.edu', 'student10@crestview.edu'
  ];
  i INTEGER;
BEGIN
  FOR i IN ARRAY_LOWER(user_ids, 1)..ARRAY_UPPER(user_ids, 1) LOOP
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
      user_ids[i],
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      emails[i],
      crypt(CASE WHEN emails[i] = 'admin@crestview.edu' THEN 'Admin@123' ELSE 'Password@123' END, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::JSONB,
      JSONB_BUILD_OBJECT('email', emails[i]),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      user_ids[i],
      user_ids[i],
      JSONB_BUILD_OBJECT('sub', user_ids[i]::TEXT, 'email', emails[i]),
      'email',
      emails[i],
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (provider, provider_id) DO NOTHING;
  END LOOP;
END $$;

INSERT INTO public.profiles (id, role_id, first_name, last_name, email, phone, nationality) VALUES
  ('00000000-0000-4000-8000-000000000001', (SELECT id FROM public.roles WHERE name = 'super_admin'), 'Crestview', 'Admin', 'admin@crestview.edu', '+10000000001', 'Ghana'),
  ('00000000-0000-4000-8000-000000000101', (SELECT id FROM public.roles WHERE name = 'teacher'), 'Ada', 'Okoro', 'ada.okoro@crestview.edu', '+10000000101', 'Nigeria'),
  ('00000000-0000-4000-8000-000000000102', (SELECT id FROM public.roles WHERE name = 'teacher'), 'Marcus', 'Lee', 'marcus.lee@crestview.edu', '+10000000102', 'United Kingdom'),
  ('00000000-0000-4000-8000-000000000103', (SELECT id FROM public.roles WHERE name = 'teacher'), 'Sophia', 'Mensah', 'sophia.mensah@crestview.edu', '+10000000103', 'Ghana'),
  ('00000000-0000-4000-8000-000000000201', (SELECT id FROM public.roles WHERE name = 'parent'), 'Nora', 'Adebayo', 'parent1@example.com', '+10000000201', 'Nigeria'),
  ('00000000-0000-4000-8000-000000000202', (SELECT id FROM public.roles WHERE name = 'parent'), 'James', 'Boateng', 'parent2@example.com', '+10000000202', 'Ghana'),
  ('00000000-0000-4000-8000-000000000203', (SELECT id FROM public.roles WHERE name = 'parent'), 'Elena', 'Garcia', 'parent3@example.com', '+10000000203', 'Spain')
ON CONFLICT (id) DO UPDATE SET role_id = EXCLUDED.role_id, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email;

INSERT INTO public.profiles (id, role_id, first_name, last_name, email, nationality)
SELECT
  ('00000000-0000-4000-8000-0000000003' || LPAD(i::TEXT, 2, '0'))::UUID,
  (SELECT id FROM public.roles WHERE name = 'student'),
  names.first_name,
  names.last_name,
  'student' || i || '@crestview.edu',
  names.nationality
FROM GENERATE_SERIES(1, 10) AS i
JOIN (
  VALUES
    (1, 'Amara', 'Cole', 'Sierra Leone'),
    (2, 'Daniel', 'Mensah', 'Ghana'),
    (3, 'Lina', 'Hassan', 'Egypt'),
    (4, 'Noah', 'Smith', 'United States'),
    (5, 'Maya', 'Chen', 'China'),
    (6, 'Kofi', 'Owusu', 'Ghana'),
    (7, 'Aisha', 'Khan', 'Pakistan'),
    (8, 'Lucas', 'Brown', 'United Kingdom'),
    (9, 'Zara', 'Ndlovu', 'South Africa'),
    (10, 'Mateo', 'Garcia', 'Spain')
) AS names(idx, first_name, last_name, nationality) ON names.idx = i
ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email;

INSERT INTO public.classrooms (name, grade_level, academic_year_id, capacity, room_number)
SELECT grade || section, grade, ay.id, 30, room_prefix || section
FROM (VALUES ('Grade 7', 'G7-'), ('Grade 8', 'G8-'), ('Grade 9', 'G9-'), ('Grade 10', 'G10-')) AS grades(grade, room_prefix)
CROSS JOIN (VALUES ('A'), ('B'), ('C')) AS sections(section)
CROSS JOIN (SELECT id FROM public.academic_years WHERE name = '2025/2026') ay
ON CONFLICT (name, academic_year_id) DO UPDATE SET grade_level = EXCLUDED.grade_level, room_number = EXCLUDED.room_number;

INSERT INTO public.students (profile_id, student_number, classroom_id)
SELECT
  p.id,
  'CVS-2026-' || LPAD(ROW_NUMBER() OVER (ORDER BY p.email)::TEXT, 3, '0'),
  (SELECT id FROM public.classrooms WHERE name = 'Grade 7A' LIMIT 1)
FROM public.profiles p
JOIN public.roles r ON r.id = p.role_id
WHERE r.name = 'student'
ON CONFLICT (profile_id) DO NOTHING;

INSERT INTO public.parent_students (parent_profile_id, student_id, relationship)
SELECT '00000000-0000-4000-8000-000000000201', s.id, 'mother'
FROM public.students s
JOIN public.profiles p ON p.id = s.profile_id
WHERE p.email IN ('student1@crestview.edu', 'student2@crestview.edu', 'student3@crestview.edu')
ON CONFLICT DO NOTHING;

INSERT INTO public.parent_students (parent_profile_id, student_id, relationship)
SELECT '00000000-0000-4000-8000-000000000202', s.id, 'father'
FROM public.students s
JOIN public.profiles p ON p.id = s.profile_id
WHERE p.email IN ('student4@crestview.edu', 'student5@crestview.edu', 'student6@crestview.edu')
ON CONFLICT DO NOTHING;

INSERT INTO public.parent_students (parent_profile_id, student_id, relationship)
SELECT '00000000-0000-4000-8000-000000000203', s.id, 'guardian'
FROM public.students s
JOIN public.profiles p ON p.id = s.profile_id
WHERE p.email IN ('student7@crestview.edu', 'student8@crestview.edu', 'student9@crestview.edu', 'student10@crestview.edu')
ON CONFLICT DO NOTHING;

INSERT INTO public.courses (subject_id, classroom_id, teacher_id, academic_year_id, term)
SELECT subject_id, classroom_id, teacher_id, academic_year_id, 'Term 2'
FROM (
  VALUES
    ((SELECT id FROM public.subjects WHERE code = 'MAT'), (SELECT id FROM public.classrooms WHERE name = 'Grade 7A'), '00000000-0000-4000-8000-000000000101'::UUID, (SELECT id FROM public.academic_years WHERE name = '2025/2026')),
    ((SELECT id FROM public.subjects WHERE code = 'ENG'), (SELECT id FROM public.classrooms WHERE name = 'Grade 7A'), '00000000-0000-4000-8000-000000000102'::UUID, (SELECT id FROM public.academic_years WHERE name = '2025/2026')),
    ((SELECT id FROM public.subjects WHERE code = 'BIO'), (SELECT id FROM public.classrooms WHERE name = 'Grade 7A'), '00000000-0000-4000-8000-000000000103'::UUID, (SELECT id FROM public.academic_years WHERE name = '2025/2026'))
) AS rows(subject_id, classroom_id, teacher_id, academic_year_id)
ON CONFLICT (subject_id, classroom_id, academic_year_id, term) DO UPDATE SET teacher_id = EXCLUDED.teacher_id;

INSERT INTO public.teacher_assignments (teacher_id, course_id)
SELECT teacher_id, id FROM public.courses
ON CONFLICT DO NOTHING;

INSERT INTO public.timetables (classroom_id, course_id, day_of_week, starts_at, ends_at, room_number, academic_year_id)
SELECT classroom_id, id, ROW_NUMBER() OVER (ORDER BY id), TIME '08:30', TIME '09:30', 'G7-A', academic_year_id
FROM public.courses
WHERE classroom_id = (SELECT id FROM public.classrooms WHERE name = 'Grade 7A')
ON CONFLICT DO NOTHING;

INSERT INTO public.assignments (course_id, title, description, due_at, created_by)
SELECT id, 'Term Project', 'Research and present a practical application from this course.', NOW() + INTERVAL '14 days', teacher_id
FROM public.courses
ON CONFLICT DO NOTHING;

INSERT INTO public.grade_items (course_id, title, category, max_score, weight, published_at)
SELECT id, 'Midterm Assessment', 'exam', 100, 0.4, NOW()
FROM public.courses
ON CONFLICT DO NOTHING;

INSERT INTO public.attendance_records (student_id, classroom_id, attendance_date, status, recorded_by)
SELECT s.id, s.classroom_id, CURRENT_DATE, CASE WHEN ROW_NUMBER() OVER (ORDER BY s.student_number) <= 8 THEN 'present' ELSE 'late' END, '00000000-0000-4000-8000-000000000101'
FROM public.students s
ON CONFLICT DO NOTHING;

INSERT INTO public.invoices (student_id, invoice_number, amount, status, due_date)
SELECT id, 'INV-2026-' || LPAD(ROW_NUMBER() OVER (ORDER BY student_number)::TEXT, 3, '0'), 1250.00, 'open', CURRENT_DATE + INTERVAL '30 days'
FROM public.students
LIMIT 5
ON CONFLICT (invoice_number) DO NOTHING;

INSERT INTO public.job_postings (title, department_id, employment_type, description, closes_on)
VALUES
  ('Senior Mathematics Teacher', (SELECT id FROM public.departments WHERE code = 'MTH'), 'full_time', 'Lead mathematics instruction across middle years.', CURRENT_DATE + INTERVAL '21 days'),
  ('Admissions Coordinator', (SELECT id FROM public.departments WHERE code = 'SOC'), 'full_time', 'Coordinate family admissions workflow and interviews.', CURRENT_DATE + INTERVAL '30 days');

INSERT INTO public.admission_applications (applicant_first_name, applicant_last_name, applying_grade, guardian_email, guardian_phone, status)
VALUES
  ('Ethan', 'Johnson', 'Grade 7', 'family.johnson@example.com', '+10000000901', 'submitted'),
  ('Fatima', 'Ali', 'Grade 8', 'family.ali@example.com', '+10000000902', 'reviewing'),
  ('Iris', 'Kobayashi', 'Grade 9', 'family.kobayashi@example.com', '+10000000903', 'accepted');

INSERT INTO public.payroll_periods (name, starts_on, ends_on, status)
VALUES ('May 2026', '2026-05-01', '2026-05-31', 'open')
ON CONFLICT (name) DO UPDATE SET starts_on = EXCLUDED.starts_on, ends_on = EXCLUDED.ends_on, status = EXCLUDED.status;

INSERT INTO public.payroll_items (payroll_period_id, staff_profile_id, gross_pay, deductions)
SELECT (SELECT id FROM public.payroll_periods WHERE name = 'May 2026'), p.id, 4200.00, 420.00
FROM public.profiles p
WHERE p.id IN ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000103');

INSERT INTO public.notifications (recipient_id, title, body, type, metadata)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Welcome to Crestview ISMS', 'Your enterprise school workspace is ready.', 'system', '{"priority":"normal"}'),
  ('00000000-0000-4000-8000-000000000101', 'Attendance Reminder', 'Grade 7A attendance is due by 9:00 AM.', 'attendance', '{"classroom":"Grade 7A"}');
