import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ShieldCheck, ArrowRight, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Store phone sessions in localStorage for demo OTP auth
const PHONE_SESSIONS_KEY = 'omnistore-phone-sessions';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function PhoneLanding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate sending

    const otp = generateOTP();
    setGeneratedOtp(otp);
    setLoading(false);
    setStep('otp');

    // Show OTP to user (demo mode – in production this would be sent via SMS)
    toast.success(`Demo OTP sent! Your OTP is: ${otp}`, {
      duration: 30000,
      description: 'In production, this would be sent via SMS.',
    });
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (otp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP');
      return;
    }

    if (otp !== generatedOtp) {
      setOtpError('Invalid OTP. Please check and try again.');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    // Store phone session
    const sessions = JSON.parse(localStorage.getItem(PHONE_SESSIONS_KEY) || '{}');
    sessions[phone.replace(/\D/g, '')] = { verifiedAt: new Date().toISOString() };
    localStorage.setItem(PHONE_SESSIONS_KEY, JSON.stringify(sessions));
    localStorage.setItem('omnistore-phone-verified', 'true');

    setLoading(false);
    toast.success('Mobile number verified! Welcome!');
    navigate('/stores');
  };

  const handleResend = () => {
    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);
    setOtp('');
    setOtpError('');
    toast.success(`New OTP sent! Your OTP is: ${newOtp}`, {
      duration: 30000,
      description: 'In production, this would be sent via SMS.',
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Header branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <Store className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">OmniStore</h1>
        <p className="text-muted-foreground mt-1">Your neighbourhood marketplace</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 w-full max-w-md mx-4"
      >
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-3">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Enter your mobile number</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll send a one-time password to verify
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-lg border border-input bg-muted text-sm font-medium text-muted-foreground">
                      +91
                    </div>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={phone}
                      onChange={e => {
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        setPhoneError('');
                      }}
                      className="flex-1 tracking-widest text-lg"
                      required
                    />
                  </div>
                  {phoneError && <p className="text-destructive text-xs mt-1">{phoneError}</p>}
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Verify OTP</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-semibold text-foreground">+91 {phone}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">OTP</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setOtpError('');
                    }}
                    className="text-center text-2xl tracking-[0.5em] h-14 font-bold"
                    required
                    autoFocus
                  />
                  {otpError && <p className="text-destructive text-xs mt-1">{otpError}</p>}
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); setOtpError(''); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Change number
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-primary font-medium hover:underline"
                >
                  Resend OTP
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-xs text-muted-foreground text-center px-4"
      >
        🔒 Your number is safe. We never share your data.
      </motion.p>
    </div>
  );
}
