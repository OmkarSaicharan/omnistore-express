import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, LogIn } from 'lucide-react';

// Beta namespace not in generated types — narrow to the three methods we use.
type OAuthClient = { name?: string; redirect_uri?: string; scope?: string };
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type AuthOauth = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};
const authOauth = (supabase.auth as unknown as { oauth: AuthOauth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const [session, setSession] = useState<any>(null);
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    (async () => {
      if (!authorizationId) return setError('Missing authorization_id');
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [authorizationId]);

  useEffect(() => {
    if (!session || !authorizationId) return;
    (async () => {
      const { data, error } = await authOauth.getAuthorizationDetails(authorizationId);
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
  }, [session, authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await authOauth.approveAuthorization(authorizationId)
      : await authOauth.denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError('No redirect returned by the authorization server.'); }
    window.location.href = target;
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, role: 'customer', store_id: '' } },
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  if (error && !details && !session) {
    return <main className="min-h-screen flex items-center justify-center p-6"><div className="glass-card p-8 max-w-md text-center"><p className="text-destructive">{error}</p></div></main>;
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-8 w-full max-w-md space-y-4">
          <div className="text-center">
            <LogIn className="h-10 w-10 mx-auto text-primary" />
            <h1 className="text-xl font-bold mt-2">Sign in to authorize access</h1>
            <p className="text-sm text-muted-foreground mt-1">
              An external app is requesting access to your OmniStore account.
            </p>
          </div>
          <div className="flex gap-2 justify-center text-sm">
            <button className={mode === 'signin' ? 'font-bold text-primary' : 'text-muted-foreground'} onClick={() => setMode('signin')}>Sign in</button>
            <span className="text-muted-foreground">·</span>
            <button className={mode === 'signup' ? 'font-bold text-primary' : 'text-muted-foreground'} onClick={() => setMode('signup')}>Create account</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-3">
            {mode === 'signup' && (
              <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
            )}
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? '...' : (mode === 'signin' ? 'Sign in' : 'Create account')}</Button>
          </form>
        </div>
      </main>
    );
  }

  if (!details) {
    return <main className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading authorization…</p></main>;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card p-8 w-full max-w-md space-y-5">
        <div className="text-center">
          <Shield className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-xl font-bold mt-2">Connect {details.client?.name ?? 'an app'} to OmniStore</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Signed in as <span className="font-medium">{session.user?.email}</span>
          </p>
        </div>
        <div className="rounded-lg border p-4 text-sm space-y-2">
          <p>This will let <b>{details.client?.name ?? 'the app'}</b> use OmniStore as you:</p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>View stores and products</li>
            <li>Read your profile and orders</li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2">Your permissions and RLS policies still control what data is accessible.</p>
        </div>
        {error && <p className="text-destructive text-sm text-center">{error}</p>}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>Cancel</Button>
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>Approve</Button>
        </div>
      </div>
    </main>
  );
}
