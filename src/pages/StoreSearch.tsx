import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Store, MapPin, Star, ArrowRight, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STORES = [
  {
    id: 'omnistore',
    name: 'OmniStore',
    tagline: 'Your One Stop General Store',
    category: 'General Store',
    rating: 4.8,
    reviews: 128,
    location: 'Main Road, Local Market',
    badge: 'Featured',
    color: 'from-primary/20 to-primary/5',
    icon: '🛒',
  },
];

export default function StoreSearch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = STORES.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleEnterStore = (storeId: string) => {
    if (storeId === 'omnistore') {
      navigate('/home');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('omnistore-phone-verified');
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">OmniStore</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="pt-20 pb-10 container mx-auto px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Find your store
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Discover shops and explore their products
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search store name, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl shadow-sm"
              autoFocus
            />
          </div>
        </motion.div>

        {/* Store count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filtered.length === 0
              ? 'No stores found'
              : `${filtered.length} store${filtered.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Store cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((store, i) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleEnterStore(store.id)}
            >
              {/* Store banner */}
              <div className={`h-28 bg-gradient-to-br ${store.color} flex items-center justify-center relative`}>
                <span className="text-5xl">{store.icon}</span>
                {store.badge && (
                  <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {store.badge}
                  </span>
                )}
              </div>

              {/* Store info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-lg leading-tight">{store.name}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-sm font-semibold">{store.rating}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-1">{store.tagline}</p>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{store.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    {store.category}
                  </span>
                  <Button size="sm" className="gap-1.5 group-hover:gap-2.5 transition-all">
                    Enter Store
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-muted-foreground"
          >
            <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No stores found</p>
            <p className="text-sm mt-1">Try searching with a different name</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
