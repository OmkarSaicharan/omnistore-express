import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset link sent to your email');
      setEmail('');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 pb-8 pt-24">
        <div className="glass-card w-full max-w-md p-8">
          <div className="mb-6 text-center">
            <Mail className="mx-auto mb-2 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold">Forgot Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter your registered email and we’ll send a reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remembered it?{' '}
            <Link to="/" className="font-medium text-primary hover:underline">
              Back to store selection
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
