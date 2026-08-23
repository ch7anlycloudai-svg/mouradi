import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

export default function Header() {
  const { lang, t, setLanguage, dir } = useLanguage();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: t.nav.home },
    { to: '/products', label: t.nav.products },
    { to: '/contact', label: t.nav.contact },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-brand-text text-white">
        <div className="container-main flex items-center justify-between h-9 text-[11px] tracking-wide">
          <p className="hidden sm:block opacity-70">{t.checkout.deliveryInfo}</p>
          <div className="flex items-center gap-2.5 ms-auto">
            <button
              onClick={() => setLanguage('ar')}
              className={`transition-opacity hover:opacity-100 ${lang === 'ar' ? 'opacity-100 font-bold' : 'opacity-50'}`}
            >
              العربية
            </button>
            <span className="opacity-20">|</span>
            <button
              onClick={() => setLanguage('fr')}
              className={`transition-opacity hover:opacity-100 ${lang === 'fr' ? 'opacity-100 font-bold' : 'opacity-50'}`}
            >
              Français
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
          scrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.06)]' : 'border-b border-brand-border'
        }`}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-[60px] md:h-[72px]">
            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ms-2 text-brand-text hover:text-primary transition-colors"
              aria-label="Menu"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0">
              <span className="text-[22px] md:text-[26px] font-bold text-brand-text tracking-tight">
                WWenatou
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-[13px] font-medium uppercase tracking-widest transition-colors link-underline ${
                    isActive(link.to) ? 'text-brand-text' : 'text-brand-text-secondary hover:text-brand-text'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-10 h-10 flex items-center justify-center text-brand-text hover:text-primary transition-colors"
                aria-label={t.nav.search}
              >
                <Search size={20} strokeWidth={1.5} />
              </button>

              <Link
                to="/wishlist"
                className="w-10 h-10 flex items-center justify-center text-brand-text hover:text-primary transition-colors relative"
                aria-label={t.nav.wishlist}
              >
                <Heart size={20} strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 end-0.5 bg-primary text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="w-10 h-10 flex items-center justify-center text-brand-text hover:text-primary transition-colors relative"
                aria-label={t.nav.cart}
              >
                <ShoppingBag size={20} strokeWidth={1.5} />
                {itemCount > 0 && (
                  <span className="absolute top-1 end-0.5 bg-primary text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Search Drawer */}
        <div
          className={`overflow-hidden transition-all duration-300 border-t border-brand-border ${
            searchOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 border-transparent'
          }`}
        >
          <div className="container-main py-3">
            <form onSubmit={handleSearchSubmit} className="relative max-w-lg mx-auto">
              <Search size={18} strokeWidth={1.5} className="absolute start-4 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.nav.search}
                className="w-full border-b border-brand-border bg-transparent ps-12 pe-10 py-3 text-sm focus:outline-none focus:border-brand-text transition-colors placeholder:text-brand-text-muted"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text"
                >
                  <X size={16} />
                </button>
              )}
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <div
            className={`absolute top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} w-[300px] h-full bg-white shadow-2xl flex flex-col`}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-6 h-[60px] border-b border-brand-border">
              <span className="text-lg font-bold text-brand-text tracking-tight">WWenatou</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-brand-text-secondary hover:text-brand-text"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-6">
              <div className="space-y-0">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block py-3.5 text-[15px] font-medium border-b border-brand-border/60 transition-colors ${
                      isActive(link.to) ? 'text-primary' : 'text-brand-text'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/wishlist"
                  className="flex items-center justify-between py-3.5 text-[15px] font-medium border-b border-brand-border/60 text-brand-text"
                >
                  {t.nav.wishlist}
                  {wishlistCount > 0 && (
                    <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-semibold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center justify-between py-3.5 text-[15px] font-medium border-b border-brand-border/60 text-brand-text"
                >
                  {t.nav.cart}
                  {itemCount > 0 && (
                    <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-semibold">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </nav>

            {/* Language switcher */}
            <div className="px-6 py-4 border-t border-brand-border flex items-center gap-3">
              <button
                onClick={() => { setLanguage('ar'); setMobileMenuOpen(false); }}
                className={`text-sm ${lang === 'ar' ? 'font-bold text-brand-text' : 'text-brand-text-secondary'}`}
              >
                العربية
              </button>
              <span className="text-brand-border">|</span>
              <button
                onClick={() => { setLanguage('fr'); setMobileMenuOpen(false); }}
                className={`text-sm ${lang === 'fr' ? 'font-bold text-brand-text' : 'text-brand-text-secondary'}`}
              >
                Français
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
