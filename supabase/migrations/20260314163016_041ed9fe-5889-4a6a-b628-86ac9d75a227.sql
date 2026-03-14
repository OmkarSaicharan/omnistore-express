
CREATE TABLE public.store_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL,
  tagline text DEFAULT '',
  category text DEFAULT '',
  location text DEFAULT '',
  state text DEFAULT '',
  admin_name text NOT NULL,
  admin_email text NOT NULL,
  admin_password text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone
);

ALTER TABLE public.store_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert store requests" ON public.store_requests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read store requests" ON public.store_requests FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update store requests" ON public.store_requests FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete store requests" ON public.store_requests FOR DELETE TO public USING (true);
