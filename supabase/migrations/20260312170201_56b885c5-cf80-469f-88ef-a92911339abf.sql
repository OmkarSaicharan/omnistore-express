
-- Create stores table
CREATE TABLE public.stores (
  id text PRIMARY KEY,
  name text NOT NULL,
  tagline text DEFAULT '',
  category text DEFAULT '',
  location text DEFAULT '',
  address text DEFAULT '',
  hero_image text DEFAULT '',
  icon text DEFAULT '🏪',
  badge text DEFAULT '',
  color text DEFAULT 'from-primary/20 to-primary/5',
  admin_user_id text NOT NULL,
  secret_key text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read stores" ON public.stores FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert stores" ON public.stores FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update stores" ON public.stores FOR UPDATE TO public USING (true);

-- Create store_categories table
CREATE TABLE public.store_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL,
  category_id text NOT NULL,
  label text NOT NULL,
  image text DEFAULT '',
  sort_order integer DEFAULT 0,
  UNIQUE(store_id, category_id)
);

ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.store_categories FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert categories" ON public.store_categories FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update categories" ON public.store_categories FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete categories" ON public.store_categories FOR DELETE TO public USING (true);

-- Add store_id to products
ALTER TABLE public.products ADD COLUMN store_id text DEFAULT 'omnistore' NOT NULL;

-- Add store_id to orders
ALTER TABLE public.orders ADD COLUMN store_id text DEFAULT 'omnistore' NOT NULL;
