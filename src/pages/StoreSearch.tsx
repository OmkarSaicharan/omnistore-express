import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Store, MapPin, Star, ArrowRight, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface StoreItem {
  id: string;
  name: string;
  tagline: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  badge?: string;
  color: string;
  icon: string;
}

function generateSecretKey() {
  return 'SK-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
}

export default function StoreSearch() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [search, setSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    storeName: '', tagline: '', category: '', location: '',
    adminName: '', email: '', password: '',
  });
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('*');
    if (data) {
      setStores(data.map(s => ({
        id: s.id,
        name: s.name,
        tagline: s.tagline || '',
        category: s.category || '',
        rating: 4.8,
        reviews: 0,
        location: s.location || '',
        badge: s.badge || undefined,
        color: s.color || 'from-primary/20 to-primary/5',
        icon: s.icon || '🏪',
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, []);

  const filtered = stores.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleEnterStore = (storeId: string) => {
    navigate(`/store/${storeId}/home`);
  };

  const handleRegisterStore = async () => {
    setError('');
    const { storeName, tagline, category, location, adminName, email, password } = formData;
    if (!storeName || !category || !adminName || !email || !password) {
      setError('Please fill all required fields');
      return;
    }
    setRegistering(true);
    try {
      const secretKey = generateSecretKey();
      const storeId = 'store-' + Date.now();
      const userId = `user-${Date.now()}`;

      // Register admin user first
      await register(adminName, email, password, 'admin');

      // Create store in DB
      await supabase.from('stores').insert({
        id: storeId,
        name: storeName,
        tagline: tagline || `Welcome to ${storeName}`,
        category,
        location: location || 'Online',
        address: location || '',
        hero_image: '',
        icon: '🏪',
        badge: '',
        color: 'from-accent/20 to-accent/5',
        admin_user_id: userId,
        secret_key: secretKey,
      });

      setShowRegister(false);
      setFormData({ storeName: '', tagline: '', category: '', location: '', adminName: '', email: '', password: '' });
      alert(`Store registered! Your admin secret key is: ${secretKey}\nSave it securely.`);
      fetchStores();
    } catch {
      setError('Registration failed. Try again.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">OmniStore</span>
          </div>
          <Button size="sm" onClick={() => setShowRegister(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Register Store
          </Button>
        </div>
      </header>

      <div className="pt-20 pb-10 container mx-auto px-4">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Find your store</h1>
          <p className="text-muted-foreground text-lg mb-8">Discover shops and explore their products</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search store name, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl shadow-sm"
              autoFocus
            />
          </div>
        </motion.div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading stores...' : filtered.length === 0 ? 'No stores found' : `${filtered.length} store${filtered.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Store cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((store, i) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleEnterStore(store.id)}
            >
              <div className={`h-28 bg-gradient-to-br ${store.color} flex items-center justify-center relative`}>
                <span className="text-5xl">{store.icon}</span>
                {store.badge && (
                  <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {store.badge}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-lg leading-tight">{store.name}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-sm font-semibold">{store.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{store.tagline}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{store.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{store.category}</span>
                  <Button size="sm" className="gap-1.5 group-hover:gap-2.5 transition-all">
                    Enter Store
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No stores found</p>
            <p className="text-sm mt-1">Try searching with a different name</p>
          </motion.div>
        )}
      </div>

      {/* Register Store Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Your Store</DialogTitle>
            <DialogDescription>Create a new store and admin account</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input placeholder="Store Name *" value={formData.storeName} onChange={e => setFormData(p => ({ ...p, storeName: e.target.value }))} />
            <Input placeholder="Tagline" value={formData.tagline} onChange={e => setFormData(p => ({ ...p, tagline: e.target.value }))} />
            <Input placeholder="Category * (e.g. General Store)" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} />
            <Input placeholder="Location" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} />
            <hr className="border-border" />
            <p className="text-sm font-medium text-muted-foreground">Admin Account</p>
            <Input placeholder="Admin Name *" value={formData.adminName} onChange={e => setFormData(p => ({ ...p, adminName: e.target.value }))} />
            <Input placeholder="Email *" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
            <Input placeholder="Password *" type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleRegisterStore} disabled={registering}>
              {registering ? 'Registering...' : 'Register Store'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
