import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { email, password, secretKey } = await req.json();
    const MASTER_KEY = Deno.env.get('MASTER_ADMIN_KEY') || 'omkar@2004';

    if (!email || !password || !secretKey) {
      return json({ error: 'Email, password and secret key are required' }, 400);
    }
    if (secretKey !== MASTER_KEY) {
      return json({ error: 'Invalid Master Admin Key' }, 401);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Find existing user by email
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase());

    if (existing) {
      userId = existing.id;
      // Reset password so the provided one works going forward
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: 'Master Admin', role: 'master_admin' },
      });
      if (createErr || !created.user) return json({ error: createErr?.message || 'Failed to create master admin' }, 400);
      userId = created.user.id;
    }

    // Ensure profile row exists
    await admin.from('profiles').upsert(
      { user_id: userId, name: 'Master Admin', email, phone: '', role: 'master_admin', store_id: '' },
      { onConflict: 'user_id' },
    );

    // Grant master_admin role
    const { data: existingRole } = await admin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'master_admin')
      .maybeSingle();

    if (!existingRole) {
      const { error: roleErr } = await admin.from('user_roles').insert({
        user_id: userId,
        role: 'master_admin',
        store_id: null,
      });
      if (roleErr) return json({ error: roleErr.message }, 400);
    }

    return json({ success: true, userId });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
