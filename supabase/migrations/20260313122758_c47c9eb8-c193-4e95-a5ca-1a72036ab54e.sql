
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS state text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_id text DEFAULT '';
