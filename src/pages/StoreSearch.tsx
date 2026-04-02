import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Store, MapPin, Star, ArrowRight, Plus, ShoppingCart, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StoreItem {
  id: string;
  name: string;
  tagline: string;
  category: string;
  rating: number;
  location: string;
  badge?: string;
}

export default function StoreSearch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Register dialog
  const [showRegister, setShowRegister] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '', tagline: '', category: '', location: '', state: '',
    adminName: '', email: '', password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Secret key dialog
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [keyError, setKeyError] = useState('');

  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('*');
    if (data) {
      setStores(data.map(s => ({
        id: s.id,
        name: s.name,
        tagline: s.tagline || '',
        category: s.category || '',
        rating: 4.8,
        location: s.location || '',
        badge: s.badge || undefined,
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

  const handleSubmitRequest = async () => {
    setError('');
    const { storeName, category, adminName, email, password } = formData;
    if (!storeName || !category || !adminName || !email || !password) {
      setError('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from('store_requests').insert({
        store_name: formData.storeName,
        tagline: formData.tagline,
        category: formData.category,
        location: formData.location,
        state: formData.state,
        admin_name: formData.adminName,
        admin_email: formData.email,
        admin_password: formData.password,
        status: 'pending',
      } as any);

      setShowRegister(false);
      setFormData({ storeName: '', tagline: '', category: '', location: '', state: '', adminName: '', email: '', password: '' });
      toast({ title: 'Request Sent', description: 'Your store registration request has been sent to the admin for approval.' });
    } catch {
      setError('Failed to submit request. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeySubmit = () => {
    if (secretInput === 'omkar@2004') {
      setShowKeyDialog(false);
      setSecretInput('');
      setKeyError('');
      navigate('/master-admin');
    } else {
      setKeyError('Invalid Admin Key');
    }
  };

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">OmniStore</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground/50 hover:text-muted-foreground"
              onClick={() => setShowKeyDialog(true)}
              title="Admin"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowRegister(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Register Store
            </Button>
          </div>
        </div>
      </header>

      <div className="pt-20 pb-10 container mx-auto px-4">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((store, i) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleEnterStore(store.id)}
              className="bg-card rounded-lg overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50 cursor-pointer"
            >
              <div className="h-20 sm:h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 text-primary/30" />
                {store.badge && (
                  <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    {store.badge}
                  </span>
                )}
              </div>
              <div className="p-2.5 sm:p-3">
                <div className="flex items-start justify-between gap-1 mb-0.5">
                  <h3 className="font-bold text-xs sm:text-sm leading-tight truncate">{store.name}</h3>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-[10px] sm:text-xs font-semibold">{store.rating}</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate mb-0.5">{store.tagline}</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{store.location}</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] sm:text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full truncate max-w-[60px] sm:max-w-none">{store.category}</span>
                  <Button size="sm" className="h-7 text-[10px] sm:text-xs px-2 sm:px-3 gap-1 group-hover:gap-1.5 transition-all pointer-events-none">
                    Enter Store
                    <ArrowRight className="h-3 w-3" />
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
            <DialogDescription>Submit a request to create your store. It will be reviewed by the platform admin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input placeholder="Store Name *" value={formData.storeName} onChange={e => setFormData(p => ({ ...p, storeName: e.target.value }))} />
            <Input placeholder="Tagline" value={formData.tagline} onChange={e => setFormData(p => ({ ...p, tagline: e.target.value }))} />
            <Input placeholder="Category * (e.g. General Store)" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} />
            <Input placeholder="Location / City" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} />
            <Input placeholder="State" value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value }))} />
            <hr className="border-border" />
            <p className="text-sm font-medium text-muted-foreground">Admin Account</p>
            <Input placeholder="Admin Name *" value={formData.adminName} onChange={e => setFormData(p => ({ ...p, adminName: e.target.value }))} />
            <Input placeholder="Email *" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
            <Input placeholder="Password *" type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleSubmitRequest} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Registration Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secret Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={v => { setShowKeyDialog(v); setKeyError(''); setSecretInput(''); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Master Admin Access</DialogTitle>
            <DialogDescription>Enter the secret admin key to continue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Enter Secret Key"
              type="password"
              value={secretInput}
              onChange={e => { setSecretInput(e.target.value); setKeyError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleKeySubmit()}
            />
            {keyError && <p className="text-sm text-destructive">{keyError}</p>}
            <Button className="w-full" onClick={handleKeySubmit}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
