CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.firebase_sync_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  payload jsonb;
  row_id text;
  row_data jsonb;
  fn_url text := 'https://yjxniqcctylkyvuyzzcq.supabase.co/functions/v1/firebase-sync';
BEGIN
  IF (TG_OP = 'DELETE') THEN
    row_data := to_jsonb(OLD);
    row_id := row_data->>'id';
    payload := jsonb_build_object('table', TG_TABLE_NAME, 'op', 'DELETE', 'id', row_id);
  ELSE
    row_data := to_jsonb(NEW);
    row_id := row_data->>'id';
    payload := jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP, 'id', row_id, 'row', row_data);
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := fn_url,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := payload
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'firebase_sync_trigger failed for %.%: %', TG_TABLE_NAME, row_id, SQLERRM;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['stores','store_categories','products','profiles','orders','credit_requests','user_roles','store_requests'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS firebase_sync_aiud ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER firebase_sync_aiud
       AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.firebase_sync_trigger()',
      t
    );
  END LOOP;
END $$;