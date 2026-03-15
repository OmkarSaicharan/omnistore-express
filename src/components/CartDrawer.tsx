import { ShoppingBag, Plus, Minus, Trash2, CreditCard, Calendar, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod, PAYMENT_METHOD_LABELS } from '@/types';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { t } = useLanguage();
  const { items, removeFromCart, updateQuantity, total, checkout } = useCart();
  const { user } = useAuth();
  const { storeId, store } = useStore();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_grab');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [creditApproved, setCreditApproved] = useState<boolean | null>(null);
  const [creditRequested, setCreditRequested] = useState(false);
  const base = `/store/${storeId}`;
  const storeName = store?.name || 'Store';

  // Check credit approval status
  useEffect(() => {
    if (!user || !storeId) return;
    const checkCredit = async () => {
      const { data } = await supabase.from('credit_requests').select('status').eq('store_id', storeId).eq('customer_user_id', user.id).order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        setCreditApproved((data[0] as any).status === 'approved');
        setCreditRequested(true);
      } else {
        setCreditApproved(null);
        setCreditRequested(false);
      }
    };
    checkCredit();
  }, [user, storeId, showPayment]);

  const handleBuyNow = () => {
    if (!user) {
      onOpenChange(false);
      navigate(`${base}/login`);
      return;
    }
    setShowPayment(true);
  };

  const handleRequestCredit = async () => {
    if (!user || !storeId) return;
    await supabase.from('credit_requests').insert({
      store_id: storeId,
      customer_user_id: user.id,
      customer_name: user.name,
      customer_email: user.email,
    } as any);
    setCreditRequested(true);
    toast.success('Credit ledger request sent to store admin!');
  };

  const handlePlaceOrder = async () => {
    if (!pickupDate || !pickupTime) {
      toast.error('Please select pickup date and time');
      return;
    }
    if (paymentMethod === 'credit_ledger' && !creditApproved) {
      toast.error('Your credit ledger request has not been approved yet');
      return;
    }

    if (paymentMethod === 'online') {
      // Online payment flow
      const order = await checkout(paymentMethod, 'paid', pickupDate, pickupTime);
      if (order) {
        const upiId = '9392965097@ybl';
        const links: Record<string, string> = {
          phonePe: `phonepe://pay?pa=${upiId}&pn=${storeName}&am=${total}&tn=${storeName}+Order+${order.id}`,
          googlePay: `tez://upi/pay?pa=${upiId}&pn=${storeName}&am=${total}&tn=${storeName}+Order+${order.id}`,
          paytm: `paytmmp://pay?pa=${upiId}&pn=${storeName}&am=${total}&tn=${storeName}+Order+${order.id}`,
        };
        // Show UPI options
        setShowPayment(false);
        onOpenChange(false);
        window.open(links.phonePe, '_blank');
        toast.success(`Order ${order.id} placed successfully!`);
      }
    } else {
      const paymentStatus = paymentMethod === 'credit_ledger' ? 'credit' : 'pending';
      const order = await checkout(paymentMethod, paymentStatus, pickupDate, pickupTime);
      if (order) {
        toast.success(`Order ${order.id} placed successfully!`);
        setShowPayment(false);
        onOpenChange(false);
      }
    }
    setPickupDate('');
    setPickupTime('');
    setPaymentMethod('cash_on_grab');
  };

  const getName = (id: string, fallback: string) => {
    const key = `product.${id}`;
    const translated = t(key);
    return translated !== key ? translated : fallback;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md bg-card">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              {t('cart.title')}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col h-[calc(100vh-12rem)]">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-muted-foreground">{t('cart.empty')}</p>
                <Button onClick={() => { onOpenChange(false); navigate(`${base}/shop`); }}>
                  {t('cart.goToShop')}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {items.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <img src={item.product.image} alt={item.product.name} className="w-14 h-14 rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{getName(item.product.id, item.product.name)}</p>
                        <p className="text-primary font-semibold text-sm">{t('currency')}{item.product.price}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 rounded-full hover:bg-muted"><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 rounded-full hover:bg-muted"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 mt-4 space-y-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('cart.total')}</span>
                    <span className="text-primary">{t('currency')}{total}</span>
                  </div>
                  <Button onClick={handleBuyNow} className="w-full gap-2" size="lg">
                    <CreditCard className="h-4 w-4" />
                    {t('cart.buyNow')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-center text-2xl font-bold text-primary">{t('currency')}{total}</p>

            {/* Payment Method */}
            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <div className="space-y-2">
                {(['cash_on_grab', 'credit_ledger', 'online'] as PaymentMethod[]).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                      paymentMethod === method ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                    } ${method === 'credit_ledger' && !creditApproved ? 'opacity-60' : ''}`}
                    disabled={method === 'credit_ledger' && creditApproved === false}
                  >
                    <CreditCard className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{PAYMENT_METHOD_LABELS[method]}</span>
                      {method === 'credit_ledger' && !creditApproved && (
                        <p className="text-xs text-muted-foreground">
                          {creditRequested ? 'Approval pending from admin' : 'Request approval first'}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {paymentMethod === 'credit_ledger' && !creditApproved && !creditRequested && (
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={handleRequestCredit}>
                  Request Credit Approval
                </Button>
              )}
            </div>

            {/* Pickup Scheduling */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Pickup Date
                </label>
                <Input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Pickup Time
                </label>
                <Input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
              </div>
            </div>

            <Button onClick={handlePlaceOrder} className="w-full" size="lg">
              Place Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
