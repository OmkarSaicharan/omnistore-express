import { ShoppingBag, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { t } = useLanguage();
  const { items, removeFromCart, updateQuantity, total, checkout } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);

  const handleBuyNow = () => {
    if (!user) {
      onOpenChange(false);
      navigate('/login');
      return;
    }
    setShowPayment(true);
  };

  const handlePayment = async (method: string) => {
    const order = await checkout();
    if (order) {
      const upiId = '9392965097@ybl';
      const links: Record<string, string> = {
        phonePe: `phonepe://pay?pa=${upiId}&pn=OmniStore&am=${total}&tn=OmniStore+Order+${order.id}`,
        googlePay: `tez://upi/pay?pa=${upiId}&pn=OmniStore&am=${total}&tn=OmniStore+Order+${order.id}`,
        paytm: `paytmmp://pay?pa=${upiId}&pn=OmniStore&am=${total}&tn=OmniStore+Order+${order.id}`,
      };
      window.open(links[method], '_blank');
      toast.success(`Order ${order.id} placed successfully!`);
      setShowPayment(false);
      onOpenChange(false);
    }
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
                <Button onClick={() => { onOpenChange(false); navigate('/shop'); }}>
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

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{t('payment.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-center text-2xl font-bold text-primary">{t('currency')}{total}</p>
            {(['phonePe', 'googlePay', 'paytm'] as const).map(method => (
              <Button key={method} variant="outline" className="w-full justify-start gap-3 h-14 text-base"
                onClick={() => handlePayment(method)}>
                <CreditCard className="h-5 w-5 text-primary" />
                {t(`payment.${method}`)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
