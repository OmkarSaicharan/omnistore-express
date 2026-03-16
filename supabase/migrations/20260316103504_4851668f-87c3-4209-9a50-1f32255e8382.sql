ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text DEFAULT ''::text;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS credit_ledger_flag boolean NOT NULL DEFAULT false;

UPDATE public.orders
SET credit_ledger_flag = true
WHERE payment_method = 'credit_ledger' AND credit_ledger_flag = false;