import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { useProducts } from '@/contexts/ProductContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CATEGORIES } from '@/data/products';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const Index = () => {
  const { products } = useProducts();
  const { t } = useLanguage();
  const featured = products.filter(p => p.stock > 20).slice(0, 8);

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">{t('cat.title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.id} id={cat.id} image={cat.image} index={i} />
          ))}
        </div>
      </section>
      {/* Featured */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold mb-8">{t('shop.featured')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Index;
