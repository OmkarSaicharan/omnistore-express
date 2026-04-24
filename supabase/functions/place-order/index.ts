import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  storeId: z.string().min(1).max(64),
  items: z.array(z.object({
    productId: z.string().min(1).max(64),
    quantity: z.number().int().min(1).max(999),
  })).min(1).max(50),
  paymentMethod: z.enum(['cash_on_grab', 'credit_ledger', 'online']),
  paymentStatus: z.enum(['pending', 'paid']).default('pending'),
  pickupDate: z.string().max(32).default(''),
  pickupTime: z.string().max(32).default(''),
});

function customerUniqueId(userId: string) {
  return `CUS-${userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const body = parsed.data;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate the user belongs to this store (or is admin/master)
    const { data: profile } = await admin
      .from('profiles')
      .select('store_id, name')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile || (profile.store_id && profile.store_id !== body.storeId)) {
      return new Response(JSON.stringify({ error: 'Forbidden: store mismatch' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Credit ledger requires approved request
    if (body.paymentMethod === 'credit_ledger') {
      const { data: cr } = await admin
        .from('credit_requests')
        .select('status')
        .eq('customer_user_id', userId)
        .eq('store_id', body.storeId)
        .eq('status', 'approved')
        .maybeSingle();
      if (!cr) {
        return new Response(JSON.stringify({ error: 'Credit ledger not approved for this customer' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const orderId = `ORD-${Math.floor(Math.random() * 100000)}-${Date.now().toString(36)}`;
    const custId = customerUniqueId(userId);

    const { data: result, error: txError } = await admin.rpc('place_order_tx', {
      _order_id: orderId,
      _user_id: userId,
      _store_id: body.storeId,
      _items: body.items.map(i => ({ product_id: i.productId, quantity: i.quantity })),
      _payment_method: body.paymentMethod,
      _payment_status: body.paymentStatus,
      _pickup_date: body.pickupDate,
      _pickup_time: body.pickupTime,
      _customer_unique_id: custId,
      _credit_ledger_flag: body.paymentMethod === 'credit_ledger',
    });

    if (txError) {
      return new Response(JSON.stringify({ error: txError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await admin.from('profiles').update({ customer_unique_id: custId }).eq('user_id', userId);

    return new Response(JSON.stringify({ success: true, order: result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
