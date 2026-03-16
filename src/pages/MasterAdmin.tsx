import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Store, Check, X, Clock, ShoppingCart, Trash2 } from 'lucide-react';
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
}

export default function MasterAdmin() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    const [reqRes, storeRes] = await Promise.all([
      supabase.from('store_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('stores').select('*').order('created_at', { ascending: false }),
    ]);
    if (reqRes.data) setRequests(reqRes.data as any);
    if (storeRes.data) setStores(storeRes.data as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (req: StoreRequest) => {
    setProcessing(req.id);
    try {
      const { data, error } = await supabase.functions.invoke('approve-store-request', { body: { requestId: req.id } });
      if (error) throw error;
      toast({ title: 'Store Approved', description: `${req.store_name} created. Secret Key: ${data.secretKey}` });
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
          <TabsList className="mb-6">
            <TabsTrigger value="requests" className="gap-1.5">
              <Clock className="h-4 w-4" />
              Requests {pending.length > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{pending.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="stores" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              All Stores ({stores.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <h2 className="mb-4 text-xl font-bold">Pending Store Requests</h2>
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
        </Tabs>
      </div>
    </div>
  );
}
