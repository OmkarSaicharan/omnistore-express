-- =========================================================
-- PHASE 1: SECURITY HARDENING
-- =========================================================

-- 1) Roles enum + user_roles table + has_role() function
CREATE TYPE public.app_role AS ENUM ('master_admin', 'store_admin', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  store_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, store_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER function avoids RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role, _store_id text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (_store_id IS NULL OR store_id = _store_id OR role = 'master_admin')
  )
$$;

-- Helper: get the current user's store_id from profiles (SECURITY DEFINER, no recursion)
CREATE OR REPLACE FUNCTION public.current_user_store_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.profiles WHERE user_id = auth.uid()::text LIMIT 1
$$;

-- RLS for user_roles itself
CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text OR public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- =========================================================
-- 2) DROP all permissive policies
-- =========================================================
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;

DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Anyone can read credit requests" ON public.credit_requests;
DROP POLICY IF EXISTS "Anyone can insert credit requests" ON public.credit_requests;
DROP POLICY IF EXISTS "Anyone can update credit requests" ON public.credit_requests;
DROP POLICY IF EXISTS "Anyone can delete credit requests" ON public.credit_requests;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.store_categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON public.store_categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON public.store_categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.store_categories;

DROP POLICY IF EXISTS "Anyone can read stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can update stores" ON public.stores;

DROP POLICY IF EXISTS "Anyone can read store requests" ON public.store_requests;
DROP POLICY IF EXISTS "Anyone can insert store requests" ON public.store_requests;
DROP POLICY IF EXISTS "Anyone can update store requests" ON public.store_requests;
DROP POLICY IF EXISTS "Anyone can delete store requests" ON public.store_requests;

-- =========================================================
-- 3) STORES — public read (storefronts are public), only store_admin/master_admin can modify
-- =========================================================
CREATE POLICY "Anyone can view stores"
  ON public.stores FOR SELECT
  USING (true);

CREATE POLICY "Store admins update own store"
  ON public.stores FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'store_admin', id) OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'store_admin', id) OR public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins insert stores"
  ON public.stores FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- =========================================================
-- 4) PRODUCTS — public read, only that store's admin can write
-- =========================================================
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Store admins manage own products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'store_admin', store_id));

CREATE POLICY "Store admins update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'store_admin', store_id))
  WITH CHECK (public.has_role(auth.uid(), 'store_admin', store_id));

CREATE POLICY "Store admins delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'store_admin', store_id));

-- =========================================================
-- 5) STORE_CATEGORIES — public read, only that store's admin writes
-- =========================================================
CREATE POLICY "Anyone can view categories"
  ON public.store_categories FOR SELECT
  USING (true);

CREATE POLICY "Store admins insert categories"
  ON public.store_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'store_admin', store_id));

CREATE POLICY "Store admins update categories"
  ON public.store_categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'store_admin', store_id))
  WITH CHECK (public.has_role(auth.uid(), 'store_admin', store_id));

CREATE POLICY "Store admins delete categories"
  ON public.store_categories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'store_admin', store_id));

-- =========================================================
-- 6) PROFILES — strict
-- =========================================================
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text
    OR public.has_role(auth.uid(), 'master_admin')
    OR public.has_role(auth.uid(), 'store_admin', store_id)
  );

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- =========================================================
-- 7) ORDERS — customers see own; store admins see store's
-- =========================================================
CREATE POLICY "Users read own or store orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text
    OR public.has_role(auth.uid(), 'store_admin', store_id)
    OR public.has_role(auth.uid(), 'master_admin')
  );

-- Order INSERT goes through edge function with service role; deny client direct insert
CREATE POLICY "No direct order inserts"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Store admins update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'store_admin', store_id))
  WITH CHECK (public.has_role(auth.uid(), 'store_admin', store_id));

-- =========================================================
-- 8) CREDIT_REQUESTS
-- =========================================================
CREATE POLICY "Customers read own credit requests"
  ON public.credit_requests FOR SELECT
  TO authenticated
  USING (
    customer_user_id = auth.uid()::text
    OR public.has_role(auth.uid(), 'store_admin', store_id)
    OR public.has_role(auth.uid(), 'master_admin')
  );

CREATE POLICY "Customers create own credit request"
  ON public.credit_requests FOR INSERT
  TO authenticated
  WITH CHECK (customer_user_id = auth.uid()::text);

CREATE POLICY "Store admins update credit requests"
  ON public.credit_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'store_admin', store_id))
  WITH CHECK (public.has_role(auth.uid(), 'store_admin', store_id));

CREATE POLICY "Store admins delete credit requests"
  ON public.credit_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'store_admin', store_id));

-- =========================================================
-- 9) STORE_REQUESTS — public can submit (open onboarding); only master admin reads/manages
-- =========================================================
CREATE POLICY "Anyone can submit store request"
  ON public.store_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Master admins read store requests"
  ON public.store_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins update store requests"
  ON public.store_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins delete store requests"
  ON public.store_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'));

-- =========================================================
-- 10) Atomic order placement RPC (transactional)
-- =========================================================
CREATE OR REPLACE FUNCTION public.place_order_tx(
  _order_id text,
  _user_id text,
  _store_id text,
  _items jsonb,           -- [{ product_id, quantity }]
  _payment_method text,
  _payment_status text,
  _pickup_date text,
  _pickup_time text,
  _customer_unique_id text,
  _credit_ledger_flag boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  prod RECORD;
  computed_total numeric := 0;
  order_items jsonb := '[]'::jsonb;
  qty int;
BEGIN
  -- Lock rows + validate stock
  FOR item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    qty := (item->>'quantity')::int;
    IF qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', item->>'product_id';
    END IF;

    SELECT id, name, price, stock, store_id INTO prod
    FROM public.products
    WHERE id = (item->>'product_id') AND store_id = _store_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found in store %', item->>'product_id', _store_id;
    END IF;

    IF prod.stock < qty THEN
      RAISE EXCEPTION 'Insufficient stock for %', prod.name;
    END IF;

    computed_total := computed_total + (prod.price * qty);
    order_items := order_items || jsonb_build_array(jsonb_build_object(
      'productName', prod.name,
      'quantity', qty,
      'price', prod.price * qty
    ));

    UPDATE public.products SET stock = stock - qty WHERE id = prod.id;
  END LOOP;

  INSERT INTO public.orders (
    id, user_id, store_id, items, total, date, ordered_at, status,
    payment_method, payment_status, pickup_date, pickup_time,
    customer_unique_id, credit_ledger_flag
  ) VALUES (
    _order_id, _user_id, _store_id, order_items, computed_total,
    to_char(now(), 'MM/DD/YYYY'), now(), 'Pending',
    _payment_method, _payment_status, _pickup_date, _pickup_time,
    _customer_unique_id, _credit_ledger_flag
  );

  RETURN jsonb_build_object('order_id', _order_id, 'total', computed_total, 'items', order_items);
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_tx(text, text, text, jsonb, text, text, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_tx(text, text, text, jsonb, text, text, text, text, text, boolean) TO service_role;

-- =========================================================
-- 11) Indexes for performance
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON public.orders(ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_store_id ON public.profiles(store_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_store_id ON public.store_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_credit_requests_store_id ON public.credit_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_credit_requests_user_id ON public.credit_requests(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_store ON public.user_roles(store_id);