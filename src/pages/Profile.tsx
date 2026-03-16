import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { User, Package, Globe, LogOut, Shield, Key, MapPin, CreditCard, Calendar, Clock, Hash, Phone } from 'lucide-react';
import { Language, PAYMENT_METHOD_LABELS, ORDER_STATUS_COLORS } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { user, updateUser, logout, isAdmin } = useAuth();
  const { orders, refreshOrders } = useCart();
  const { storeId, store, updateStore } = useStore();
  const navigate = useNavigate();
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editing, setEditing] = useState(false);
  const [editStoreName, setEditStoreName] = useState('');
  const [editingStore, setEditingStore] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editingAddress, setEditingAddress] = useState(false);
  const [customerUniqueId, setCustomerUniqueId] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('customer_unique_id, phone').eq('user_id', user.id).maybeSingle();
      if (data?.customer_unique_id) setCustomerUniqueId(data.customer_unique_id);
      if (data?.phone) setEditPhone(data.phone);
      if (!data?.customer_unique_id) {
        const genId = `CUS-${user.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`;
        setCustomerUniqueId(genId);
        await supabase.from('profiles').update({ customer_unique_id: genId } as never).eq('user_id', user.id);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => { refreshOrders(); }, []);

  if (!user) return <Navigate to={`/store/${storeId}/login`} replace />;

  const handleSave = () => {
    updateUser({ name: editName, phone: editPhone });
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveStoreName = async () => {
    if (editStoreName.trim()) {
      await updateStore({ name: editStoreName.trim() });
      setEditingStore(false);
    }
  };

  const handleSaveAddress = async () => {
    if (editAddress.trim()) {
      await updateStore({ address: editAddress.trim() });
      setEditingAddress(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pb-8 pt-24">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-3xl font-bold">{t('profile.title')}</motion.h1>

        <div className="glass-card mb-6 p-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {editPhone || 'No phone added'}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> Store ID: {user.storeId || storeId}</p>
              {customerUniqueId && <p className="mt-1 flex items-center gap-1 font-mono text-xs text-primary"><Hash className="h-3 w-3" /> {customerUniqueId}</p>}
            </div>
          </div>
          {editing ? (
            <div className="space-y-2">
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" />
              <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone" />
              <div className="flex gap-2">
                <Button onClick={handleSave}>{t('profile.save')}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>{t('admin.cancel')}</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => { setEditName(user.name); setEditPhone(user.phone || ''); setEditing(true); }}>
              {t('profile.changeName')}
            </Button>
          )}
        </div>

        {isAdmin && store && (
          <div className="glass-card mb-6 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Admin Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Store Name</p>
                {editingStore ? (
                  <div className="flex gap-2">
                    <Input value={editStoreName} onChange={e => setEditStoreName(e.target.value)} />
                    <Button onClick={handleSaveStoreName}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingStore(false)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{store.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setEditStoreName(store.name); setEditingStore(true); }}>Edit</Button>
                  </div>
                )}
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" /> Store Address</p>
                {editingAddress ? (
                  <div className="flex gap-2">
                    <Input value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Enter store address" />
                    <Button onClick={handleSaveAddress}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingAddress(false)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{store.address || 'Not set'}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setEditAddress(store.address || ''); setEditingAddress(true); }}>Edit</Button>
                  </div>
                )}
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-sm text-muted-foreground"><Key className="h-3 w-3" /> Admin Secret Key</p>
                <code className="block break-all rounded-md bg-secondary px-3 py-1.5 text-sm">{store.secret_key}</code>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card mb-6 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="font-bold">{t('profile.language')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang => (
              <button key={lang.code} onClick={() => setLanguage(lang.code)} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${language === lang.code ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card mb-6 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="font-bold">{t('profile.orders')}</h2>
          </div>
          {orders.length === 0 ? (
            <p className="text-muted-foreground">{t('profile.noOrders')}</p>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="space-y-2 rounded-lg bg-secondary/50 p-4">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-semibold">{order.id}</span>
                    <div className="text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-secondary text-secondary-foreground'}`}>
                        {order.status}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">{order.date}</p>
                    </div>
                  </div>
                  {order.items.map((item, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{item.quantity}x {item.productName} — {t('currency')}{item.price}</p>
                  ))}
                  <div className="flex flex-wrap gap-3 pt-1 text-xs">
                    <span className="flex items-center gap-1"><CreditCard className="h-3 w-3 text-primary" /> {PAYMENT_METHOD_LABELS[order.paymentMethod || 'cash_on_grab']}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Payment: {order.paymentStatus === 'ledger' ? 'Ledger' : order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</span>
                    {(order.pickupDate || order.pickupTime) && <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-primary" /> {order.pickupDate} <Clock className="ml-1 h-3 w-3" /> {order.pickupTime}</span>}
                  </div>
                  <p className="text-sm font-bold text-primary">{t('cart.total')}: {t('currency')}{order.total}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
      <Footer />
    </div>
  );
}
