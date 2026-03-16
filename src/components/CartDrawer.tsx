import { ShoppingBag, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { OrderPaymentDialog } from './OrderPaymentDialog';

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
  const base = `/store/${storeId}`;
  const storeName = store?.name || 'Store';

  const openUpiApp = (method: 'phonePe' | 'googlePay' | 'paytm', amount: number, orderId: string) => {
    const upiId = '9392965097@ybl';
    const links: Record<typeof method, string> = {
      phonePe: `phonepe://pay?pa=${upiId}&pn=${storeName}&am=${amount}&tn=${storeName}+Order+${orderId}`,
      googlePay: `tez://upi/pay?pa=${upiId}&pn=${storeName}&am=${amount}&tn=${storeName}+Order+${orderId}`,
      paytm: `paytmmp://pay?pa=${upiId}&pn=${storeName}&am=${amount}&tn=${storeName}+Order+${orderId}`,
    };
    window.open(links[method], '_blank');
  };

  const handleCheckout = () => {
    if (!user) {
      onOpenChange(false);
      navigate(`${base}/login`);
      return;
    }
    setShowPayment(true);
  };

  const handleConfirm = async ({ paymentMethod, paymentStatus, pickupDate, pickupTime, upiApp }: { paymentMethod: any; paymentStatus: string; pickupDate: string; pickupTime: string; upiApp?: 'phonePe' | 'googlePay' | 'paytm'; }) => {
    const order = await checkout(paymentMethod, paymentStatus, pickupDate, pickupTime);
    if (!order) return;

    if (paymentMethod === 'online' && upiApp) {
      openUpiApp(upiApp, total, order.id);
      toast.success(`Order ${order.id} placed with online payment`);
    } else if (paymentMethod === 'credit_ledger') {
      toast.success(`Order ${order.id} placed under Credit Ledger`);
    } else {
      toast.success(`Order ${order.id} placed with Cash on Grab`);
    }

    setShowPayment(false);
    onOpenChange(false);
  };

  const getName = (id: string, fallback: string) => {
    const key = `product.${id}`;
    const translated = t(key);
    return translated !== key ? translated : fallback;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full bg-card sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              {t('cart.title')}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex h-[calc(100vh-12rem)] flex-col">
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-muted-foreground">{t('cart.empty')}</p>
                <Button onClick={() => { onOpenChange(false); navigate(`${base}/shop`); }}>
                  {t('cart.goToShop')}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                      <img src={item.product.image} alt={item.product.name} className="h-14 w-14 rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{getName(item.product.id, item.product.name)}</p>
                        <p className="text-sm font-semibold text-primary">{t('currency')}{item.product.price}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="rounded-full p-1 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="rounded-full p-1 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('cart.total')}</span>
                    <span className="text-primary">{t('currency')}{total}</span>
                  </div>
                  <Button onClick={handleCheckout} className="w-full gap-2" size="lg">
                    <CreditCard className="h-4 w-4" />
                    Checkout
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <OrderPaymentDialog amount={total} open={showPayment} onOpenChange={setShowPayment} onConfirm={handleConfirm} />
    </>
  );
}
