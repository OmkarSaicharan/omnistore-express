import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    const init = async () => {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          toast.error('Reset link is invalid or expired');
        } else {
          setReady(true);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
    };

    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully');
      navigate('/');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto mt-12 max-w-md">
        <div className="glass-card p-8">
          <div className="mb-6 text-center">
            <KeyRound className="mx-auto mb-2 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">Choose a new password for your account.</p>
          </div>

          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">Open the reset link from your email to continue.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">New Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Confirm Password</label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
