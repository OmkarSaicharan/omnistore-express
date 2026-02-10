import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Contact() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent successfully!');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-8 container mx-auto px-4">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8">{t('contact.title')}</motion.h1>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8">
            <h2 className="text-xl font-bold mb-6">{t('contact.getInTouch')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('contact.name')}</label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('contact.email')}</label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('contact.message')}</label>
                <Textarea rows={4} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full gap-2">
                <Send className="h-4 w-4" /> {t('contact.send')}
              </Button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8">
            <h2 className="text-xl font-bold mb-6">{t('contact.info')}</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10"><Phone className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium">{t('contact.ownerName')}</p>
                  <p className="text-muted-foreground">{t('contact.phone')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10"><Mail className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium">{t('auth.email')}</p>
                  <p className="text-muted-foreground">{t('contact.emailAddr')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10"><MapPin className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium">{t('contact.address')}</p>
                  <p className="text-muted-foreground">{t('contact.addressText')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
