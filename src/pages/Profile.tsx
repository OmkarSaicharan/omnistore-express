import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { User, Package, Globe, LogOut, Shield, Key } from 'lucide-react';
import { Language } from '@/types';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

function getAdminStore(email: string) {
  try {
    const stores = JSON.parse(localStorage.getItem('omnistore-custom-stores') || '[]');
    return stores.find((s: any) => s.adminEmail === email) || null;
  } catch { return null; }
}

function updateStoreName(email: string, newName: string) {
  try {
    const stores = JSON.parse(localStorage.getItem('omnistore-custom-stores') || '[]');
    const idx = stores.findIndex((s: any) => s.adminEmail === email);
    if (idx !== -1) {
      stores[idx].name = newName;
      localStorage.setItem('omnistore-custom-stores', JSON.stringify(stores));
    }
  } catch {}
}

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { user, updateUser, logout, isAdmin } = useAuth();
  const { orders } = useCart();
  const navigate = useNavigate();
  const [editName, setEditName] = useState(user?.name || '');
  const [editing, setEditing] = useState(false);
  const [editStoreName, setEditStoreName] = useState('');
  const [editingStore, setEditingStore] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const adminStore = isAdmin ? getAdminStore(user.email) : null;

  const handleSave = () => {
    updateUser({ name: editName });
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveStoreName = () => {
    if (editStoreName.trim() && adminStore) {
      updateStoreName(user.email, editStoreName.trim());
      setEditingStore(false);
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
        {isAdmin && adminStore && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Admin Settings</h2>
            </div>
            <div className="space-y-3">
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
                    <span className="font-semibold">{adminStore.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setEditStoreName(adminStore.name); setEditingStore(true); }}>Edit</Button>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Key className="h-3 w-3" /> Admin Secret Key
                </p>
                <code className="text-sm bg-secondary px-3 py-1.5 rounded-md block break-all">{adminStore.adminSecretKey}</code>
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
                <div key={order.id} className="p-4 rounded-lg bg-secondary/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">{order.id}</span>
                    <span className="text-xs text-muted-foreground">{order.date}</span>
                  </div>
                  {order.items.map((item, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {item.quantity}x {item.productName} — {t('currency')}{item.price}
                    </p>
                  ))}
                  <p className="text-sm font-bold text-primary mt-1">{t('cart.total')}: {t('currency')}{order.total}</p>
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
