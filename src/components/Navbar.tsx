import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, User, LogOut, Shield, Home, Grid3X3, Store, Info, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { CartDrawer } from './CartDrawer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Navbar() {
  const { t } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/home', label: t('nav.home'), icon: Home },
    { to: '/shop', label: t('nav.shop'), icon: Store },
    { to: '/categories', label: t('nav.categories'), icon: Grid3X3 },
    { to: '/about', label: t('nav.about'), icon: Info },
    { to: '/contact', label: t('nav.contact'), icon: Phone },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top header bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <button className="p-2 rounded-lg hover:bg-muted -ml-1">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-card">
                <div className="mt-8 flex flex-col gap-1">
                  <Link to="/home" className="text-xl font-bold text-primary mb-6">{t('app.name')}</Link>
                  {navLinks.map(link => (
                    <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${isActive(link.to) ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted'}`}>
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t my-4" />
                  {user ? (
                    <>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileOpen(false)}
                          className="px-4 py-3 rounded-lg font-medium flex items-center gap-3 hover:bg-muted">
                          <Shield className="h-4 w-4" /> {t('nav.admin')}
                        </Link>
                      )}
                      <Link to="/profile" onClick={() => setMobileOpen(false)}
                        className="px-4 py-3 rounded-lg font-medium flex items-center gap-3 hover:bg-muted">
                        <User className="h-4 w-4" /> {t('nav.profile')}
                      </Link>
                      <button onClick={() => { logout(); setMobileOpen(false); }}
                        className="px-4 py-3 rounded-lg font-medium flex items-center gap-3 hover:bg-muted text-left">
                        <LogOut className="h-4 w-4" /> {t('nav.logout')}
                      </button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      className="px-4 py-3 rounded-lg font-medium text-primary hover:bg-muted flex items-center gap-3">
                      <User className="h-4 w-4" /> {t('nav.login')}
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/home" className="text-lg sm:text-xl font-bold text-primary">
              {t('app.name')}
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.to) ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-muted'}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Cart */}
            <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 sm:w-5 sm:h-5 sm:text-xs rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Auth Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Shield className="h-4 w-4" /> {t('nav.admin')}
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <User className="h-4 w-4" /> {t('nav.profile')}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={logout} className="gap-1">
                    <LogOut className="h-4 w-4" /> {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button size="sm">{t('nav.login')}</Button>
                </Link>
              )}
            </div>

            {/* Mobile auth icon */}
            <div className="md:hidden">
              {user ? (
                <Link to="/profile" className="p-2 rounded-lg hover:bg-muted">
                  <User className="h-5 w-5" />
                </Link>
              ) : (
                <Link to="/login" className="p-2 rounded-lg hover:bg-muted">
                  <User className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}