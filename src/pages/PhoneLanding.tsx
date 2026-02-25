import { useState, useMemo } from 'react';
import { Search, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { useProducts } from '@/contexts/ProductContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CATEGORIES } from '@/data/products';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';   // ensure you have a Button component
import { motion } from 'framer-motion';

type OtpStep = 'idle' | 'otpSent' | 'verified';

const Index = () => {
  const { products } = useProducts();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  // OTP related state
  const [step, setStep] = useState<OtpStep>('idle');
  const [contact, setContact] = useState('');          // email or phone
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(''); // in real app, this stays on server
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Featured products logic (unchanged)
  const featured = useMemo(() => {
    let result = products.filter(p => p.stock > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    } else {
      result = result.filter(p => p.stock > 20).slice(0, 8);
    }
    return result;
  }, [products, search]);

  // Simulate sending OTP – replace with actual API call
  const handleSendOtp = () => {
    if (!contact) return;
    // In production, send contact to backend and receive OTP
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockOtp);
    console.log(`[OTP SIMULATION] OTP for ${contact}: ${mockOtp}`);
    setStep('otpSent');
    setVerificationStatus('idle');
    setOtpInput('');
  };

  // Simulate verification – replace with actual API call
  const handleVerifyOtp = () => {
    // In real scenario, you'd send {contact, otpInput} to backend
    if (otpInput === generatedOtp) {
      setVerificationStatus('success');
      setStep('verified');
      // You can now set user as authenticated, store token, etc.
    } else {
      setVerificationStatus('error');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* OTP Section */}
      <div className="container mx-auto px-3 sm:px-4 py-4 border-b">
        {step !== 'verified' ? (
          <div className="max-w-md mx-auto bg-card p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5" /> Verify with OTP
            </h3>
            {step === 'idle' && (
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  placeholder="Enter email or phone"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
                <Button onClick={handleSendOtp} disabled={!contact}>
                  Send OTP
                </Button>
              </div>
            )}
            {step === 'otpSent' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  OTP sent to {contact} (check console)
                </p>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  maxLength={6}
                />
                <div className="flex gap-2">
                  <Button onClick={handleVerifyOtp} variant="default">
                    Verify
                  </Button>
                  <Button onClick={() => setStep('idle')} variant="outline">
                    Change contact
                  </Button>
                </div>
                {verificationStatus === 'error' && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Invalid OTP
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-green-50 dark:bg-green-950/20 p-4 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-green-700 dark:text-green-300">
              Verified successfully! You can now browse.
            </span>
          </div>
        )}
      </div>

      <Hero />

      {/* Categories */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-16">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-8">{t('cat.title')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.id} id={cat.id} image={cat.image} index={i} />
          ))}
        </div>
      </section>

      {/* Featured with Search */}
      <section className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">{t('shop.featured')}</h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('shop.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {featured.length === 0 ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-muted-foreground py-16">
            {t('shop.noProducts')}
          </motion.p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

