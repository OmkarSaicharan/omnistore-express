
-- 1. pgcrypto for bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Restrict SELECT on stores.secret_key column-by-column
REVOKE SELECT ON public.stores FROM anon, authenticated;
GRANT SELECT (id, name, tagline, category, location, address, hero_image, icon, badge, color, admin_user_id, created_at, state)
  ON public.stores TO anon, authenticated;
GRANT ALL ON public.stores TO service_role;

-- 3. Secure lookup: master_admin or the store's own admin can fetch the secret key
CREATE OR REPLACE FUNCTION public.get_store_secret_key(_store_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.secret_key
  FROM public.stores s
  WHERE s.id = _store_id
    AND (
      public.has_role(auth.uid(), 'master_admin'::app_role)
      OR public.has_role(auth.uid(), 'store_admin'::app_role, s.id)
    );
$$;
REVOKE ALL ON FUNCTION public.get_store_secret_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_secret_key(text) TO authenticated;

-- 4. Secure verify: anyone submitting the correct key for a store returns true, without disclosing it
CREATE OR REPLACE FUNCTION public.verify_store_secret_key(_store_id text, _key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores WHERE id = _store_id AND secret_key = _key
  );
$$;
REVOKE ALL ON FUNCTION public.verify_store_secret_key(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_store_secret_key(text, text) TO anon, authenticated;

-- 5. Hash admin_password on store_requests before storing
CREATE OR REPLACE FUNCTION public.hash_store_request_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.admin_password IS NOT NULL
     AND length(NEW.admin_password) > 0
     AND left(NEW.admin_password, 4) <> '$2a$'
     AND left(NEW.admin_password, 4) <> '$2b$'
     AND left(NEW.admin_password, 4) <> '$2y$' THEN
    NEW.admin_password := extensions.crypt(NEW.admin_password, extensions.gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hash_store_request_password_bi ON public.store_requests;
CREATE TRIGGER hash_store_request_password_bi
  BEFORE INSERT OR UPDATE OF admin_password ON public.store_requests
  FOR EACH ROW EXECUTE FUNCTION public.hash_store_request_password();

-- Retro-hash any existing plaintext rows so no plaintext remains at rest.
UPDATE public.store_requests
SET admin_password = extensions.crypt(admin_password, extensions.gen_salt('bf'))
WHERE admin_password IS NOT NULL
  AND length(admin_password) > 0
  AND left(admin_password, 4) NOT IN ('$2a$', '$2b$', '$2y$');
