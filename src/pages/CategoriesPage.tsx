import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CategoryCard } from '@/components/CategoryCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { CATEGORIES } from '@/data/products';
import { motion } from 'framer-motion';

export default function CategoriesPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 sm:pt-24 pb-8 container mx-auto px-3 sm:px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{t('cat.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">{t('cat.subtitle')}</p>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.id} id={cat.id} image={cat.image} index={i} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}