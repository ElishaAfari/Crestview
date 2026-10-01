-- The proprietor is the school's primary operator. Keep the database
-- permission set in parity with the technical super-admin role as well as the
-- application-level primary-admin guards.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT owner.id, permission.permission_id
FROM public.roles AS owner
JOIN public.roles AS super_admin ON super_admin.name = 'super_admin'
JOIN public.role_permissions AS permission ON permission.role_id = super_admin.id
WHERE owner.name = 'school_owner'
ON CONFLICT (role_id, permission_id) DO NOTHING;
