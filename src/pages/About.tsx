import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Award, Heart, Users } from 'lucide-react';

export default function About() {
  const { t } = useLanguage();
  const values = [
    { icon: Award, title: t('about.quality'), text: t('about.qualityText') },
    { icon: Heart, title: t('about.fair'), text: t('about.fairText') },
    { icon: Users, title: t('about.community'), text: t('about.communityText') },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-8 container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{t('about.title')}</h1>
          <div className="glass-card p-8 mb-8">
            <h2 className="text-xl font-bold text-primary mb-3">{t('about.mission')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('about.missionText')}</p>
          </div>
          <div className="glass-card p-8 mb-8">
            <h2 className="text-xl font-bold text-primary mb-3">{t('about.story')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('about.storyText')}</p>
          </div>
          <h2 className="text-xl font-bold mb-6">{t('about.values')}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="glass-card p-6 text-center">
                <v.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
