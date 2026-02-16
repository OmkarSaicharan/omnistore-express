import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background/80 mt-8 sm:mt-16">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-background mb-2 sm:mb-3">{t('app.name')}</h3>
            <p className="text-xs sm:text-sm leading-relaxed">{t('app.tagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-2 sm:mb-3 text-sm sm:text-base">{t('nav.shop')}</h4>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <Link to="/shop" className="block hover:text-primary transition-colors">{t('nav.shop')}</Link>
              <Link to="/categories" className="block hover:text-primary transition-colors">{t('nav.categories')}</Link>
              <Link to="/about" className="block hover:text-primary transition-colors">{t('nav.about')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-2 sm:mb-3 text-sm sm:text-base">{t('contact.info')}</h4>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t('contact.phone')}</p>
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t('contact.emailAddr')}</p>
              <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t('contact.addressText')}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center text-xs sm:text-sm">
          <p>© {new Date().getFullYear()} {t('app.name')}. {t('footer.rights')}</p>
          <p className="mt-1">{t('footer.madeWith')}</p>
        </div>
      </div>
    </footer>
  );
}