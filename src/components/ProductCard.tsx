import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap, CreditCard } from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { StockBar } from './StockBar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { t } = useLanguage();
  const { addToCart, buyNow } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const name = t(`product.${product.id}`) !== `product.${product.id}` ? t(`product.${product.id}`) : product.name;
  const desc = t(`product.${product.id}.desc`) !== `product.${product.id}.desc` ? t(`product.${product.id}.desc`) : product.description;

  const requireLogin = () => {
    if (!user) { toast.error('Please login first'); navigate('/login'); return true; }
    return false;
  };

  const handleAddToCart = () => {
    if (requireLogin()) return;
    addToCart(product);
    toast.success(`${name} added to cart!`);
  };

  const handleBuyNowClick = () => {
    if (requireLogin()) return;
    setShowPayment(true);
  };

  const handlePayment = async (method: string) => {
    const order = await buyNow(product);
    if (order) {
      const upiId = '9392965097@ybl';
      const links: Record<string, string> = {
        phonePe: `phonepe://pay?pa=${upiId}&pn=OmniStore&am=${product.price}&tn=OmniStore+Order+${order.id}`,
        googlePay: `tez://upi/pay?pa=${upiId}&pn=OmniStore&am=${product.price}&tn=OmniStore+Order+${order.id}`,
        paytm: `paytmmp://pay?pa=${upiId}&pn=OmniStore&am=${product.price}&tn=OmniStore+Order+${order.id}`,
      };
      window.open(links[method], '_blank');
      toast.success(`Order ${order.id} placed for ${name}!`);
      setShowPayment(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        className="glass-card overflow-hidden group hover-lift"
      >
        <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden">
          <img
            src={product.image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
          />
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
            {t('currency')}{product.price}
          </div>
        </div>
        <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
          <h3 className="font-semibold text-foreground text-xs sm:text-sm md:text-base line-clamp-1">{name}</h3>
          <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-1 hidden sm:block">{desc}</p>
          <StockBar stock={product.stock} maxStock={product.maxStock} />
          {product.stock > 0 ? (
            <div className="flex gap-1.5 sm:gap-2">
              <Button onClick={handleAddToCart} variant="outline" className="flex-1 gap-1 text-[10px] sm:text-xs px-1.5 sm:px-3" size="sm">
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sm:hidden">Cart</span>
                <span className="hidden sm:inline">Add to Cart</span>
              </Button>
              <Button onClick={handleBuyNowClick} className="flex-1 gap-1 text-[10px] sm:text-xs px-1.5 sm:px-3" size="sm">
                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sm:hidden">Buy</span>
                <span className="hidden sm:inline">Buy Now</span>
              </Button>
            </div>
          ) : (
            <Button disabled className="w-full text-xs sm:text-sm" size="sm" variant="secondary">
              {t('shop.outOfStock')}
            </Button>
          )}
        </div>
      </motion.div>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{t('payment.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{name}</p>
              <p className="text-2xl font-bold text-primary">{t('currency')}{product.price}</p>
            </div>
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
