import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoreRequestRow {
  id: string;
  store_name: string;
  tagline: string | null;
  category: string | null;
  location: string | null;
  state: string | null;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  status: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

function generateSecretKey() {
  return `SK-${crypto.randomUUID().slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return new Response(JSON.stringify({ error: 'requestId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: requestRow, error: requestError } = await admin
      .from('store_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (requestError || !requestRow) {
      return new Response(JSON.stringify({ error: 'Request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storeRequest = requestRow as StoreRequestRow;

    if (storeRequest.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Request already processed' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseId = slugify(storeRequest.store_name) || 'store';
    let storeId = baseId;

    const { data: existingStore } = await admin.from('stores').select('id').eq('id', baseId).maybeSingle();
    if (existingStore) {
      storeId = `${baseId}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const secretKey = generateSecretKey();

    const { data: authUserData, error: authError } = await admin.auth.admin.createUser({
      email: storeRequest.admin_email,
      password: storeRequest.admin_password,
      email_confirm: true,
      user_metadata: {
        name: storeRequest.admin_name,
        role: 'admin',
        store_id: storeId,
      },
    });

    if (authError || !authUserData.user) {
      return new Response(JSON.stringify({ error: authError?.message || 'Failed to create admin account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminUserId = authUserData.user.id;

    const { error: storeError } = await admin.from('stores').insert({
      id: storeId,
      name: storeRequest.store_name,
      tagline: storeRequest.tagline || `Welcome to ${storeRequest.store_name}`,
      category: storeRequest.category || '',
      location: storeRequest.location || 'Online',
      address: storeRequest.location || '',
      state: storeRequest.state || '',
      hero_image: '',
      icon: '🏪',
      badge: '',
      color: 'from-primary/20 to-primary/5',
      admin_user_id: adminUserId,
      secret_key: secretKey,
    });

    if (storeError) {
      await admin.auth.admin.deleteUser(adminUserId);
      throw storeError;
    }

    const { error: profileError } = await admin.from('profiles').insert({
      user_id: adminUserId,
      name: storeRequest.admin_name,
      email: storeRequest.admin_email,
      phone: '',
      role: 'admin',
      store_id: storeId,
    });

    if (profileError) {
      await admin.from('stores').delete().eq('id', storeId);
      await admin.auth.admin.deleteUser(adminUserId);
      throw profileError;
    }

    await admin.from('store_requests').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      admin_password: '',
    }).eq('id', requestId);

    return new Response(JSON.stringify({ success: true, storeId, secretKey }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});