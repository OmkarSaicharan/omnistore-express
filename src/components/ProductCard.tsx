import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass-card overflow-hidden group hover-lift"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={product.image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
          {t('currency')}{product.price}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground line-clamp-1">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{desc}</p>
        <StockBar stock={product.stock} maxStock={product.maxStock} />
        {product.stock > 0 ? (
          <Button
            onClick={() => { if (!user) { toast.error('Please login to add items to cart'); navigate('/login'); return; } addToCart(product); toast.success(`${name} added to cart!`); }}
            className="w-full gap-2"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4" />
            {t('shop.addToCart')}
          </Button>
        ) : (
          <Button disabled className="w-full" size="sm" variant="secondary">
            {t('shop.outOfStock')}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
