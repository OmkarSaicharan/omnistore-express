import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Store, Check, X, Clock, ShoppingCart, Trash2, KeyRound, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StoreRequest {
  id: string;
  store_name: string;
  tagline: string;
  category: string;
  location: string;
  state: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  status: string;
  created_at: string;
}

interface StoreItem {
  id: string;
  name: string;
  tagline: string | null;
  category: string | null;
  location: string | null;
  state: string | null;
  created_at: string | null;
  admin_user_id: string;
  secret_key: string;
}

interface AdminProfile {
  user_id: string;
  name: string;
  email: string;
  store_id: string | null;
}

export default function MasterAdmin() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [admins, setAdmins] = useState<Record<string, AdminProfile>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [loadError, setLoadError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  const verifyAccess = async (): Promise<boolean> => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.user) {
      toast({ title: 'Sign in required', description: 'Please sign in as Master Admin.', variant: 'destructive' });
      navigate('/');
      return false;
    }
    const { data: roleRow, error: roleErr } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', sess.session.user.id)
      .eq('role', 'master_admin')
      .maybeSingle();
    if (roleErr) {
      console.error('Role check failed:', roleErr);
      setLoadError(roleErr.message);
      return false;
    }
    if (!roleRow) {
      toast({ title: 'Access denied', description: 'You are not a Master Admin.', variant: 'destructive' });
      navigate('/');
      return false;
    }
    return true;
  };

  const fetchData = async (attempt = 0): Promise<void> => {
    if (attempt === 0) setLoading(true);
    setLoadError('');
    const [reqRes, storeRes] = await Promise.all([
      supabase.from('store_requests').select('*').order('created_at', { ascending: false }),
      supabase
        .from('stores')
        .select('id,name,tagline,category,location,state,created_at,admin_user_id')
        .order('created_at', { ascending: false }),
    ]);
    if (reqRes.error || storeRes.error) {
      const err = reqRes.error || storeRes.error!;
      console.error('Failed to load master admin data:', { requestError: reqRes.error, storeError: storeRes.error });
      const isNetwork = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
      if (isNetwork && attempt < 5) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        setLoadError(`Backend is waking up... retrying in ${Math.round(delay / 1000)}s`);
        setTimeout(() => fetchData(attempt + 1), delay);
        return;
      }
      setRequests([]);
      setStores([]);
      setAdmins({});
      setLoadError(isNetwork ? 'Backend is unavailable. Please resume and try again.' : err.message);
      setLoading(false);
      return;
    }
    if (reqRes.data) setRequests(reqRes.data as any);
    const baseStores = (storeRes.data || []) as Omit<StoreItem, 'secret_key'>[];
    // Fetch each store's secret_key via secure RPC (master_admin passes the has_role check)
    const storeList: StoreItem[] = await Promise.all(
      baseStores.map(async (s) => {
        const { data: sk } = await supabase.rpc('get_store_secret_key', { _store_id: s.id });
        return { ...s, secret_key: (sk as string) || '' };
      })
    );
    setStores(storeList);

    // Fetch admin profiles for all stores
    const adminIds = storeList.map(s => s.admin_user_id).filter(Boolean);
    if (adminIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, name, email, store_id')
        .in('user_id', adminIds);
      if (profs) {
        const map: Record<string, AdminProfile> = {};
        profs.forEach((p: any) => { map[p.user_id] = p; });
        setAdmins(map);
      }
    }
    setLoading(false);
  };


  useEffect(() => {
    (async () => {
      const ok = await verifyAccess();
      setAuthChecked(true);
      if (!ok) return;
      fetchData();
    })();

    const onFocus = () => fetchData();
    window.addEventListener('focus', onFocus);

    // Realtime: refresh when stores or store_requests change
    const channel = supabase
      .channel('master-admin-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_requests' }, () => fetchData())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleApprove = async (req: StoreRequest) => {
    setProcessing(req.id);
    try {
      const { data, error } = await supabase.functions.invoke('approve-store-request', { body: { requestId: req.id } });
      if (error) throw error;
      const inviteNote = data?.inviteSent ? ' Invite email sent to admin — they will set their password from the link.' : '';
      toast({ title: 'Store Approved', description: `${req.store_name} created. Secret Key: ${data.secretKey}.${inviteNote}` });
      fetchData();

    } catch {
      toast({ title: 'Error', description: 'Failed to approve store', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (req: StoreRequest) => {
    setProcessing(req.id);
    await supabase.from('store_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() } as never).eq('id', req.id);
    toast({ title: 'Request Rejected', description: `${req.store_name} registration was rejected.` });
    fetchData();
    setProcessing(null);
  };

  const handleDeleteStore = async (store: StoreItem) => {
    if (!confirm(`Delete store "${store.name}"? This cannot be undone.`)) return;
    await supabase.from('products').delete().eq('store_id', store.id);
    await supabase.from('store_categories').delete().eq('store_id', store.id);
    await supabase.from('orders').delete().eq('store_id', store.id);
    await supabase.from('profiles').delete().eq('store_id', store.id);
    await supabase.from('stores').delete().eq('id', store.id);
    toast({ title: 'Store Deleted', description: `${store.name} has been removed.` });
    fetchData();
  };

  const copyToClipboard = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  const pending = requests.filter(r => r.status === 'pending');
  const reviewed = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Store className="h-5 w-5 text-primary" />
          <span className="font-bold text-primary">Master Admin</span>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 pb-10 pt-20">
        <Tabs defaultValue="requests">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="requests" className="gap-1.5">
              <Clock className="h-4 w-4" />
              Requests {pending.length > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{pending.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="stores" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              All Stores ({stores.length})
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-1.5">
              <KeyRound className="h-4 w-4" />
              Secret Keys ({stores.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <h2 className="mb-4 text-xl font-bold">Pending Store Requests</h2>
            {loadError && <p className="mb-4 text-sm text-destructive">{loadError}</p>}
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : pending.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pending.map(req => (
                  <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex-1 space-y-1">
                        <h3 className="text-lg font-bold">{req.store_name}</h3>
                        <p className="text-sm text-muted-foreground">{req.tagline}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{req.category}</span>
                          {req.location && <span>{req.location}</span>}
                          {req.state && <span>• {req.state}</span>}
                        </div>
                        <div className="mt-3 space-y-0.5 border-t border-border pt-3">
                          <p className="text-sm"><span className="font-medium">Admin:</span> {req.admin_name}</p>
                          <p className="text-sm"><span className="font-medium">Email:</span> {req.admin_email}</p>
                          <p className="text-xs text-muted-foreground">Submitted {new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" onClick={() => handleApprove(req)} disabled={processing === req.id} className="gap-1.5">
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(req)} disabled={processing === req.id} className="gap-1.5">
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {reviewed.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 text-lg font-semibold text-muted-foreground">Reviewed Requests</h3>
                <div className="space-y-3">
                  {reviewed.map(req => (
                    <div key={req.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-4">
                      <div>
                        <p className="font-medium">{req.store_name}</p>
                        <p className="text-xs text-muted-foreground">{req.admin_name} • {req.admin_email}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${req.status === 'approved' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stores">
            <h2 className="mb-4 text-xl font-bold">All Stores</h2>
            {stores.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">No stores yet</p>
            ) : (
              <div className="space-y-3">
                {stores.map(store => (
                  <div key={store.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">{store.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">{store.tagline}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{store.category}</span>
                        {store.location && <span>{store.location}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/store/${store.id}/home`)}>View</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteStore(store)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="keys">
            <h2 className="mb-2 text-xl font-bold">Store Admin Secret Keys</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Confidential — every approved store's admin login secret key is shown here. New stores appear automatically.
            </p>
            {stores.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">No stores yet</p>
            ) : (
              <div className="space-y-3">
                {stores.map(store => {
                  const admin = admins[store.admin_user_id];
                  const isRevealed = revealed[store.id];
                  return (
                    <motion.div
                      key={store.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-bold">{store.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {admin ? `${admin.name} • ${admin.email}` : 'Admin profile loading...'}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5">
                          {store.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 p-2">
                        <KeyRound className="h-4 w-4 text-primary shrink-0" />
                        <code className="flex-1 truncate text-xs sm:text-sm font-mono">
                          {isRevealed ? store.secret_key : '•'.repeat(Math.min(store.secret_key?.length || 16, 22))}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setRevealed(p => ({ ...p, [store.id]: !p[store.id] }))}
                          title={isRevealed ? 'Hide' : 'Reveal'}
                        >
                          {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyToClipboard(`${store.name} secret key`, store.secret_key)}
                          title="Copy"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
