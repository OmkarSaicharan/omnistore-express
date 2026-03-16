import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Calendar, Clock, Wallet, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from '@/types';
import { toast } from 'sonner';

interface OrderPaymentDialogProps {
  amount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: {
    paymentMethod: PaymentMethod;
    paymentStatus: string;
    pickupDate: string;
    pickupTime: string;
    upiApp?: 'phonePe' | 'googlePay' | 'paytm';
  }) => Promise<void>;
}

const upiApps = [
  { id: 'phonePe', label: 'PhonePe' },
  { id: 'googlePay', label: 'Google Pay' },
  { id: 'paytm', label: 'Paytm' },
] as const;

export function OrderPaymentDialog({ amount, open, onOpenChange, onConfirm }: OrderPaymentDialogProps) {
  const { user } = useAuth();
  const { storeId } = useStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [upiApp, setUpiApp] = useState<(typeof upiApps)[number]['id']>('phonePe');
  const [creditApproved, setCreditApproved] = useState<boolean | null>(null);
  const [creditRequested, setCreditRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user || !storeId) return;

    const checkCredit = async () => {
      const { data } = await supabase
        .from('credit_requests')
        .select('status')
        .eq('store_id', storeId)
        .eq('customer_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const approved = data[0].status === 'approved';
        setCreditApproved(approved);
        setCreditRequested(true);
        if (approved) setPaymentMethod('credit_ledger');
      } else {
        setCreditApproved(null);
        setCreditRequested(false);
      }
    };

    checkCredit();
  }, [open, user, storeId]);

  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const resetState = () => {
    setPaymentMethod('online');
    setPickupDate('');
    setPickupTime('');
    setUpiApp('phonePe');
    setSubmitting(false);
  };

  const handleRequestCredit = async () => {
    if (!user || !storeId) return;

    const { data: existing } = await supabase
      .from('credit_requests')
      .select('id,status')
      .eq('store_id', storeId)
      .eq('customer_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existing && existing.length > 0 && existing[0].status === 'pending') {
      setCreditRequested(true);
      toast.info('Your credit request is already pending review');
      return;
    }

    const { error } = await supabase.from('credit_requests').insert({
      store_id: storeId,
      customer_user_id: user.id,
      customer_name: user.name,
      customer_email: user.email,
      status: 'pending',
    } as never);

    if (error) {
      toast.error('Failed to send credit request');
      return;
    }

    setCreditRequested(true);
    setCreditApproved(false);
    toast.success('Credit request sent to the store admin');
  };

  const handleConfirm = async () => {
    if (!pickupDate || !pickupTime) {
      toast.error('Please select pickup date and time');
      return;
    }

    if (paymentMethod === 'credit_ledger' && !creditApproved) {
      toast.error('Credit Ledger is not approved yet');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm({
        paymentMethod,
        paymentStatus: paymentMethod === 'online' ? 'paid' : paymentMethod === 'credit_ledger' ? 'ledger' : 'pending',
        pickupDate,
        pickupTime,
        upiApp: paymentMethod === 'online' ? upiApp : undefined,
      });
      resetState();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetState();
      }}
    >
      <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Selection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-xl bg-secondary/40 p-4 text-center">
            <p className="text-sm text-muted-foreground">Order Total</p>
            <p className="text-2xl font-bold text-primary">₹{amount}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Payment Method</label>
            {(['online', 'cash_on_grab', 'credit_ledger'] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${paymentMethod === method ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-secondary/40'}`}
              >
                <div className="flex items-start gap-3">
                  {method === 'online' ? <Smartphone className="mt-0.5 h-4 w-4 text-primary" /> : method === 'credit_ledger' ? <Wallet className="mt-0.5 h-4 w-4 text-primary" /> : <CreditCard className="mt-0.5 h-4 w-4 text-primary" />}
                  <div>
                    <p className="text-sm font-medium">{PAYMENT_METHOD_LABELS[method]}</p>
                    <p className="text-xs text-muted-foreground">
                      {method === 'online'
                        ? 'Pay with PhonePe, Google Pay or Paytm'
                        : method === 'cash_on_grab'
                          ? 'Place the order now and collect payment on pickup'
                          : creditApproved
                            ? 'Approved for this store'
                            : creditRequested
                              ? 'Approval pending from the store admin'
                              : 'Request approval from the store admin first'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {paymentMethod === 'credit_ledger' && !creditApproved && (
              <Button type="button" variant="outline" className="w-full" onClick={handleRequestCredit}>
                Request Credit
              </Button>
            )}
          </div>

          {paymentMethod === 'online' && (
            <div className="space-y-2">
              <label className="text-sm font-medium block">UPI App</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {upiApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setUpiApp(app.id)}
                    className={`rounded-xl border p-3 text-sm font-medium transition-colors ${upiApp === app.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:bg-secondary/40'}`}
                  >
                    {app.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium">
                <Calendar className="h-3.5 w-3.5" /> Pickup Date
              </label>
              <Input type="date" min={minDate} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium">
                <Clock className="h-3.5 w-3.5" /> Pickup Time
              </label>
              <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Processing...' : paymentMethod === 'online' ? 'Continue to Payment' : 'Place Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
