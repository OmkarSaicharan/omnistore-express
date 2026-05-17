INSERT INTO public.user_roles (user_id, role, store_id)
SELECT DISTINCT p.user_id::uuid, 'store_admin'::public.app_role, NULLIF(p.store_id, '')
FROM public.profiles p
JOIN public.stores s
  ON s.admin_user_id = p.user_id
WHERE p.user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p.user_id::uuid
      AND ur.role = 'store_admin'::public.app_role
      AND COALESCE(ur.store_id, '') = COALESCE(NULLIF(p.store_id, ''), '')
  );

INSERT INTO public.user_roles (user_id, role, store_id)
SELECT DISTINCT p.user_id::uuid, 'customer'::public.app_role, NULLIF(p.store_id, '')
FROM public.profiles p
WHERE COALESCE(p.role, 'customer') <> 'admin'
  AND p.user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p.user_id::uuid
      AND ur.role = 'customer'::public.app_role
      AND COALESCE(ur.store_id, '') = COALESCE(NULLIF(p.store_id, ''), '')
  );