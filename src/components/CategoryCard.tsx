import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryCardProps {
  id: string;
  image: string;
  index?: number;
}

export function CategoryCard({ id, image, index = 0 }: CategoryCardProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`/shop?category=${id}`} className="block group">
        <div className="relative h-28 sm:h-36 md:h-48 rounded-xl overflow-hidden hover-lift">
          <img src={image} alt={t(`cat.${id}`)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4">
            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg">{t(`cat.${id}`)}</h3>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}