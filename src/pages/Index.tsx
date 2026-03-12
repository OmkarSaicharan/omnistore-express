import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { useProducts } from '@/contexts/ProductContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStore } from '@/contexts/StoreContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Index = () => {
  const { products } = useProducts();
  const { t } = useLanguage();
  const { categories } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const featured = useMemo(() => {
    let result = products.filter(p => p.stock > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    } else {
      result = result.filter(p => p.stock > 20).slice(0, 8);
    }
    return result;
  }, [products, search]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 pt-20 pb-2">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Stores
        </Button>
      </div>
      <Hero />
      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-8">{t('cat.title')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.category_id} id={cat.category_id} label={cat.label} image={cat.image} index={i} />
            ))}
          </div>
        </section>
      )}
      {/* Featured with Search */}
      <section className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">{t('shop.featured')}</h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('shop.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>
        {featured.length === 0 ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-muted-foreground py-16">
            {products.length === 0 ? 'No products yet. Admin can add products from the admin panel.' : t('shop.noProducts')}
          </motion.p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Index;
