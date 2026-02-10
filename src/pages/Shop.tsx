import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { useProducts } from '@/contexts/ProductContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CATEGORIES } from '@/data/products';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function Shop() {
  const { products } = useProducts();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const activeCategory = searchParams.get('category') || '';

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory) result = result.filter(p => p.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => {
        const name = t(`product.${p.id}`) !== `product.${p.id}` ? t(`product.${p.id}`) : p.name;
        return name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      });
    }
    return result;
  }, [products, activeCategory, search, t]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-8 container mx-auto px-4">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-6">{t('shop.title')}</motion.h1>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('shop.search')} value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSearchParams({})}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!activeCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}>
              {t('shop.all')}
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setSearchParams({ category: cat.id })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}>
                {t(`cat.${cat.id}`)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">{t('shop.noProducts')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
