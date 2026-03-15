
-- Add new columns to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash_on_grab',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pickup_date text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_time text DEFAULT '',
  ADD COLUMN IF NOT EXISTS customer_unique_id text DEFAULT '';

-- Add unique customer ID to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS customer_unique_id text DEFAULT '';

-- Create credit_requests table
CREATE TABLE IF NOT EXISTS public.credit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL,
  customer_user_id text NOT NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone
);

ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read credit requests" ON public.credit_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert credit requests" ON public.credit_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update credit requests" ON public.credit_requests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete credit requests" ON public.credit_requests FOR DELETE USING (true);
