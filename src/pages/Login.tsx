import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (await login(email, password)) {
      navigate(email === 'omkarsaicharan@gmail.com' ? '/admin' : '/profile');
    } else {
      setError(t('auth.loginError'));
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-8 container mx-auto px-4 flex items-center justify-center min-h-[80vh]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <LogIn className="h-10 w-10 text-primary mx-auto mb-2" />
            <h1 className="text-2xl font-bold">{t('auth.login')}</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('auth.email')}</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('auth.password')}</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full">{t('auth.loginBtn')}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">{t('auth.register')}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
