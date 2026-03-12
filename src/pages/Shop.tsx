import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { useProducts } from '@/contexts/ProductContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStore } from '@/contexts/StoreContext';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function Shop() {
  const { products } = useProducts();
  const { t } = useLanguage();
  const { categories } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const activeCategory = searchParams.get('category') || '';

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory) result = result.filter(p => p.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return result;
  }, [products, activeCategory, search]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 sm:pt-24 pb-8 container mx-auto px-3 sm:px-4">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">{t('shop.title')}</motion.h1>

        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('shop.search')} value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 h-10 sm:h-11" />
          </div>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <button onClick={() => setSearchParams({})}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${!activeCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}>
              {t('shop.all')}
            </button>
            {categories.map(cat => (
              <button key={cat.category_id} onClick={() => setSearchParams({ category: cat.category_id })}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeCategory === cat.category_id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            {products.length === 0 ? 'No products yet. Admin can add products from the admin panel.' : t('shop.noProducts')}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
