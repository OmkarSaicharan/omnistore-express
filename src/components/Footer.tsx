import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background/80 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-background mb-3">{t('app.name')}</h3>
            <p className="text-sm leading-relaxed">{t('app.tagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-3">{t('nav.shop')}</h4>
            <div className="space-y-2 text-sm">
              <Link to="/shop" className="block hover:text-primary transition-colors">{t('nav.shop')}</Link>
              <Link to="/categories" className="block hover:text-primary transition-colors">{t('nav.categories')}</Link>
              <Link to="/about" className="block hover:text-primary transition-colors">{t('nav.about')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-3">{t('contact.info')}</h4>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {t('contact.phone')}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {t('contact.emailAddr')}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {t('contact.addressText')}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 mt-8 pt-6 text-center text-sm">
          <p>© {new Date().getFullYear()} {t('app.name')}. {t('footer.rights')}</p>
          <p className="mt-1">{t('footer.madeWith')}</p>
        </div>
      </div>
    </footer>
  );
}
