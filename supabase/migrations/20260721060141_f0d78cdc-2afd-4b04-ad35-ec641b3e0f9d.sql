
GRANT ALL ON public.stores TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.stores TO authenticated;
-- Grant SELECT only on non-sensitive columns (exclude secret_key)
GRANT SELECT (id, name, tagline, category, location, address, state, hero_image, icon, badge, color, admin_user_id, created_at) ON public.stores TO anon;
GRANT SELECT (id, name, tagline, category, location, address, state, hero_image, icon, badge, color, admin_user_id, created_at) ON public.stores TO authenticated;
