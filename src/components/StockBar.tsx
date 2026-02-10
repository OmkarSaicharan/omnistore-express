import { useLanguage } from '@/contexts/LanguageContext';

interface StockBarProps {
  stock: number;
  maxStock: number;
}

export function StockBar({ stock, maxStock }: StockBarProps) {
  const { t } = useLanguage();
  const percentage = (stock / maxStock) * 100;
  const colorClass = percentage > 25 ? 'stock-green' : percentage > 15 ? 'stock-orange' : 'stock-red';
  const label = stock <= 0 ? t('shop.outOfStock') : percentage <= 15 ? t('shop.lowStock') : t('shop.inStock');

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{stock}/{maxStock}</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
