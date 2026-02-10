import { motion } from 'framer-motion';
import { ArrowRight, Layers } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroBanner from '@/assets/hero-banner.jpg';

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative h-[85vh] min-h-[500px] flex items-center overflow-hidden">
      <img src={heroBanner} alt="Store" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/shop">
              <Button size="lg" className="gap-2 text-base px-8 h-12">
                {t('hero.shopNow')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/categories">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12 border-white/30 text-white hover:bg-white/10 hover:text-white bg-white/5">
                <Layers className="h-4 w-4" /> {t('hero.explore')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
