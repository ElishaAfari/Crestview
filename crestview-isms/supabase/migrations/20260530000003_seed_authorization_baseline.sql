-- Production-safe authorization baseline. Demo users and school records belong in seed.sql only.
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
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

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
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  module = EXCLUDED.module;

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
JOIN public.permissions p ON p.name IN (
  'students:read', 'grades:read', 'grades:write', 'attendance:read',
  'attendance:write', 'reports:read', 'ai:use'
)
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
