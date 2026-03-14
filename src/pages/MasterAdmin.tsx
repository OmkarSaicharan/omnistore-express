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

function generateSecretKey() {
  return 'SK-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
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
      const storeId = 'store-' + Date.now();
      const userId = `user-${Date.now()}`;
      const secretKey = generateSecretKey();

      // Create the store
      await supabase.from('stores').insert({
        id: storeId,
        name: req.store_name,
        tagline: req.tagline || `Welcome to ${req.store_name}`,
        category: req.category,
        location: req.location || 'Online',
        address: req.location || '',
        state: req.state || '',
        hero_image: '',
        icon: '🏪',
        badge: '',
        color: 'from-primary/20 to-primary/5',
        admin_user_id: userId,
        secret_key: secretKey,
      } as any);

      // Create admin profile
      await supabase.from('profiles').insert({
        user_id: userId,
        name: req.admin_name,
        email: req.admin_email,
        role: 'admin',
        store_id: storeId,
      } as any);

      // Save admin user to localStorage
      const users = JSON.parse(localStorage.getItem('omnistore-users') || '[]');
      users.push({
        id: userId,
        name: req.admin_name,
        email: req.admin_email,
        password: req.admin_password,
        role: 'admin',
        registeredAt: new Date().toISOString(),
      });
      localStorage.setItem('omnistore-users', JSON.stringify(users));

      // Update request status
      await supabase.from('store_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() } as any).eq('id', req.id);

      toast({ title: 'Store Approved', description: `${req.store_name} has been created. Secret Key: ${secretKey}` });
      fetchData();
    } catch {
      toast({ title: 'Error', description: 'Failed to approve store', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (req: StoreRequest) => {
    setProcessing(req.id);
    await supabase.from('store_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() } as any).eq('id', req.id);
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
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Store className="h-5 w-5 text-primary" />
          <span className="font-bold text-primary">Master Admin</span>
        </div>
      </header>

      <div className="pt-20 pb-10 container mx-auto px-4 max-w-4xl">
        <Tabs defaultValue="requests">
          <TabsList className="mb-6">
            <TabsTrigger value="requests" className="gap-1.5">
              <Clock className="h-4 w-4" />
              Requests {pending.length > 0 && <span className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full ml-1">{pending.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="stores" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              All Stores ({stores.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <h2 className="text-xl font-bold mb-4">Pending Store Requests</h2>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : pending.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pending.map(req => (
                  <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <h3 className="font-bold text-lg">{req.store_name}</h3>
                        <p className="text-sm text-muted-foreground">{req.tagline}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                          <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{req.category}</span>
                          {req.location && <span>{req.location}</span>}
                          {req.state && <span>• {req.state}</span>}
                        </div>
                        <div className="mt-3 pt-3 border-t border-border space-y-0.5">
                          <p className="text-sm"><span className="font-medium">Admin:</span> {req.admin_name}</p>
                          <p className="text-sm"><span className="font-medium">Email:</span> {req.admin_email}</p>
                          <p className="text-xs text-muted-foreground">Submitted {new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
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
                <h3 className="text-lg font-semibold mb-3 text-muted-foreground">Reviewed Requests</h3>
                <div className="space-y-3">
                  {reviewed.map(req => (
                    <div key={req.id} className="bg-card/50 border border-border/50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{req.store_name}</p>
                        <p className="text-xs text-muted-foreground">{req.admin_name} • {req.admin_email}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stores">
            <h2 className="text-xl font-bold mb-4">All Stores</h2>
            {stores.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center">No stores yet</p>
            ) : (
              <div className="space-y-3">
                {stores.map(store => (
                  <div key={store.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{store.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{store.tagline}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                        <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{store.category}</span>
                        {store.location && <span>{store.location}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/store/${store.id}/home`)}>
                        View
                      </Button>
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
