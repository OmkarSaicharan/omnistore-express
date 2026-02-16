import { motion } from 'framer-motion';
import { ShoppingCart, Plus } from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { StockBar } from './StockBar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = t(`product.${product.id}`) !== `product.${product.id}` ? t(`product.${product.id}`) : product.name;
  const desc = t(`product.${product.id}.desc`) !== `product.${product.id}.desc` ? t(`product.${product.id}.desc`) : product.description;

  const handleAddToCart = () => {
    if (!user) { toast.error('Please login to add items to cart'); navigate('/login'); return; }
    addToCart(product);
    toast.success(`${name} added to cart!`);
  };

  return (
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
          <Button onClick={handleAddToCart} className="w-full gap-1.5 text-xs sm:text-sm" size="sm">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">{t('shop.addToCart')}</span>
          </Button>
        ) : (
          <Button disabled className="w-full text-xs sm:text-sm" size="sm" variant="secondary">
            {t('shop.outOfStock')}
          </Button>
        )}
      </div>
    </motion.div>
  );
}