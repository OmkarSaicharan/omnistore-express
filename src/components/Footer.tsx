import { useLanguage } from '@/contexts/LanguageContext';
import { useStore } from '@/contexts/StoreContext';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();
  const { storeId, store } = useStore();
  const base = `/store/${storeId}`;
  const storeName = store?.name || t('app.name');

  return (
    <footer className="bg-foreground text-background/80 mt-8 sm:mt-16">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-background mb-2 sm:mb-3">{storeName}</h3>
            <p className="text-xs sm:text-sm leading-relaxed">{store?.tagline || t('app.tagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-2 sm:mb-3 text-sm sm:text-base">{t('nav.shop')}</h4>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <Link to={`${base}/shop`} className="block hover:text-primary transition-colors">{t('nav.shop')}</Link>
              <Link to={`${base}/categories`} className="block hover:text-primary transition-colors">{t('nav.categories')}</Link>
              <Link to={`${base}/about`} className="block hover:text-primary transition-colors">{t('nav.about')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-2 sm:mb-3 text-sm sm:text-base">{t('contact.info')}</h4>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              {store?.address && (
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {store.address}</p>
              )}
              {store?.location && (
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {store.location}</p>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center text-xs sm:text-sm">
          <p>© {new Date().getFullYear()} {storeName}. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
