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
import { User, Package, Globe, LogOut, Shield, Key, MapPin, CreditCard, Calendar, Clock, Hash } from 'lucide-react';
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
  const [editing, setEditing] = useState(false);
  const [editStoreName, setEditStoreName] = useState('');
  const [editingStore, setEditingStore] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editingAddress, setEditingAddress] = useState(false);
  const [customerUniqueId, setCustomerUniqueId] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchId = async () => {
      const { data } = await supabase.from('profiles').select('customer_unique_id').eq('user_id', user.id).maybeSingle();
      if (data && (data as any).customer_unique_id) {
        setCustomerUniqueId((data as any).customer_unique_id);
      } else {
        const genId = `CUS-${user.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`;
        setCustomerUniqueId(genId);
        await supabase.from('profiles').update({ customer_unique_id: genId } as any).eq('user_id', user.id);
      }
    };
    fetchId();
  }, [user]);

  useEffect(() => { refreshOrders(); }, []);

  if (!user) return <Navigate to={`/store/${storeId}/login`} replace />;

  const handleSave = () => {
    updateUser({ name: editName });
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
      <div className="pt-24 pb-8 container mx-auto px-4 max-w-2xl">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8">{t('profile.title')}</motion.h1>

        {/* User Info */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {customerUniqueId && (
                <p className="text-xs text-primary font-mono flex items-center gap-1 mt-1">
                  <Hash className="h-3 w-3" /> {customerUniqueId}
                </p>
              )}
            </div>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
              <Button onClick={handleSave}>{t('profile.save')}</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>{t('admin.cancel')}</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => { setEditName(user.name); setEditing(true); }}>
              {t('profile.changeName')}
            </Button>
          )}
        </div>

        {/* Admin Section */}
        {isAdmin && store && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Admin Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Store Name</p>
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
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Store Address
                </p>
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
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Key className="h-3 w-3" /> Admin Secret Key
                </p>
                <code className="text-sm bg-secondary px-3 py-1.5 rounded-md block break-all">{store.secret_key}</code>
              </div>
            </div>
          </div>
        )}

        {/* Language */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="font-bold">{t('profile.language')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang => (
              <button key={lang.code} onClick={() => setLanguage(lang.code)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${language === lang.code ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="font-bold">{t('profile.orders')}</h2>
          </div>
          {orders.length === 0 ? (
            <p className="text-muted-foreground">{t('profile.noOrders')}</p>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm">{order.id}</span>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-secondary text-secondary-foreground'}`}>
                        {order.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{order.date}</p>
                    </div>
                  </div>
                  {order.items.map((item, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {item.quantity}x {item.productName} — {t('currency')}{item.price}
                    </p>
                  ))}
                  <div className="flex flex-wrap gap-3 text-xs pt-1">
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3 text-primary" />
                      {PAYMENT_METHOD_LABELS[order.paymentMethod || 'cash_on_grab']}
                    </span>
                    {(order.pickupDate || order.pickupTime) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-primary" />
                        {order.pickupDate} <Clock className="h-3 w-3 ml-1" /> {order.pickupTime}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-primary">{t('cart.total')}: {t('currency')}{order.total}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
      <Footer />
    </div>
  );
}
