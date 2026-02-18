import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { UserPlus, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const ADMIN_SECRET_KEY = 'OMNISTORE_ADMIN_2024';

export default function Register() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Admin register
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (await register(name, email, password)) {
      navigate('/profile');
    } else {
      setError(t('auth.registerError'));
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (adminSecretKey !== ADMIN_SECRET_KEY) {
      setAdminError('Invalid admin secret key. Please contact the store owner.');
      return;
    }

    // Register as admin — we pass an extra marker via email prefix for now
    // The AuthContext will handle admin role assignment
    const success = await register(adminName, adminEmail, adminPassword, 'admin');
    if (success) {
      navigate('/admin');
    } else {
      setAdminError(t('auth.registerError'));
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-8 container mx-auto px-4 flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md space-y-4">
          {/* Customer Register */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8">
            <div className="text-center mb-6">
              <UserPlus className="h-10 w-10 text-primary mx-auto mb-2" />
              <h1 className="text-2xl font-bold">{t('auth.register')}</h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('auth.name')}</label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('auth.email')}</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('auth.password')}</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full">{t('auth.registerBtn')}</Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">{t('auth.login')}</Link>
            </p>
          </motion.div>

          {/* Admin Register (collapsible) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
            <button
              onClick={() => setShowAdmin(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Admin Registration</span>
              </div>
              {showAdmin ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {showAdmin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 pb-6 pt-2 border-t border-border/50"
              >
                <p className="text-xs text-muted-foreground mb-4">
                  Admin accounts require a secret key from the store owner.
                </p>
                <form onSubmit={handleAdminSubmit} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Full Name</label>
                    <Input value={adminName} onChange={e => setAdminName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email</label>
                    <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Password</label>
                    <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Admin Secret Key</label>
                    <Input
                      type="password"
                      placeholder="Enter secret key..."
                      value={adminSecretKey}
                      onChange={e => setAdminSecretKey(e.target.value)}
                      required
                    />
                  </div>
                  {adminError && <p className="text-destructive text-sm">{adminError}</p>}
                  <Button type="submit" variant="secondary" className="w-full gap-2">
                    <Shield className="h-4 w-4" /> Register as Admin
                  </Button>
                </form>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
