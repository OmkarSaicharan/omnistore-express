-- When a new auth user is created, mirror them into user_roles as 'customer' if they don't already have a role.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role text;
  meta_store text;
BEGIN
  meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  meta_store := COALESCE(NEW.raw_user_meta_data->>'store_id', '');

  IF meta_role = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role, store_id)
    VALUES (NEW.id, 'store_admin', NULLIF(meta_store, ''))
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role, store_id)
    VALUES (NEW.id, 'customer', NULLIF(meta_store, ''))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();