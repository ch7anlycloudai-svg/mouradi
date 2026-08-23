import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Star, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { publicApi } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import QuickViewModal from '../components/common/QuickViewModal';
import { PageLoader } from '../components/common/LoadingSpinner';
import { getLocalizedField } from '../utils/helpers';
import { Product, Category, HeroBanner, PromoBanner, Testimonial } from '../utils/types';

interface HomepageData {
  heroBanners: HeroBanner[];
  categories: Category[];
  newArrivals: Product[];
  featuredProducts: Product[];
  saleProducts: Product[];
  promoBanners: PromoBanner[];
  testimonials: Testimonial[];
}

export default function HomePage() {
  const { lang, t, dir } = useLanguage();
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    publicApi.getHomepage()
      .then(setData)
      .catch((err: any) => { setError(err.message || t.common.error); toast.error(t.common.error); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (error) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="text-brand-text-secondary">{error}</p>
      <button onClick={() => window.location.reload()} className="btn-primary">{t.common.retry}</button>
    </div>
  );
  if (!data) return null;

  const hero = data.heroBanners?.find(b => b.is_active);
  const promos = data.promoBanners?.filter(b => b.is_active) || [];
  const testimonials = data.testimonials?.filter(t => t.is_active) || [];
  const categories = data.categories || [];
  const newArrivals = (data.newArrivals || []).slice(0, 8);
  const featuredProducts = (data.featuredProducts || []).slice(0, 8);
  const saleProducts = (data.saleProducts || []).slice(0, 8);

  const SectionHeader = ({ title, link, linkText }: { title: string; link?: string; linkText?: string }) => (
    <div className="flex items-end justify-between mb-8 md:mb-10">
      <div>
        <div className="section-label mb-2">WWenatou</div>
        <h2 className="section-title">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium text-brand-text link-underline pb-0.5">
          {linkText || t.home.viewAll}
          <Arrow size={14} />
        </Link>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>WWenatou Shopping{lang === 'ar' ? ' | أزياء نسائية فاخرة' : ' | Mode Féminine Premium'}</title>
        <meta name="description" content={lang === 'ar'
          ? 'متجر WWenatou Shopping لأزياء النساء الفاخرة في موريتانيا'
          : 'WWenatou Shopping - Mode féminine premium en Mauritanie'} />
      </Helmet>

      {/* ==================== HERO ==================== */}
      <section className="relative w-full overflow-hidden bg-[#f5f5f5]">
        {hero ? (
          <>
            <div className="relative min-h-[55vh] sm:min-h-[65vh] md:min-h-[75vh]">
              <img
                src={hero.image_url}
                alt={getLocalizedField(hero, 'title', lang)}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="relative z-10 min-h-[55vh] sm:min-h-[65vh] md:min-h-[75vh] flex items-end">
                <div className="container-main w-full pb-10 sm:pb-14 md:pb-20">
                  <div className="max-w-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 mb-3">
                      WWenatou Shopping
                    </p>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-[1.15]">
                      {getLocalizedField(hero, 'title', lang) || t.hero.defaultTitle}
                    </h1>
                    <p className="text-sm sm:text-base text-white/80 mb-7 leading-relaxed max-w-md">
                      {getLocalizedField(hero, 'subtitle', lang) || t.hero.defaultSubtitle}
                    </p>
                    <Link
                      to={hero.cta_link || '/products'}
                      className="inline-flex items-center gap-2.5 bg-white text-brand-text text-[13px] font-semibold uppercase tracking-widest px-8 py-4 hover:bg-primary hover:text-white transition-all duration-300"
                    >
                      {getLocalizedField(hero, 'cta_text', lang) || t.hero.shopNow}
                      <Arrow size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-[55vh] md:min-h-[70vh] flex items-center bg-gradient-to-br from-primary-light via-white to-primary-50">
            <div className="container-main text-center w-full py-16">
              <p className="section-label mb-3">WWenatou Shopping</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-text mb-5 leading-[1.15]">
                {t.hero.defaultTitle}
              </h1>
              <p className="text-base text-brand-text-secondary mb-8 max-w-md mx-auto">
                {t.hero.defaultSubtitle}
              </p>
              <Link to="/products" className="btn-primary gap-2.5">
                {t.hero.shopNow}
                <Arrow size={15} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ==================== CATEGORIES ==================== */}
      {categories.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="container-main">
            <SectionHeader title={t.home.categories} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="group relative aspect-[4/5] overflow-hidden bg-[#f5f5f5]"
                >
                  {cat.image_url && (
                    <img
                      src={cat.image_url}
                      alt={getLocalizedField(cat, 'name', lang)}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-4 md:p-5">
                    <h3 className="text-white text-sm md:text-base font-semibold">
                      {getLocalizedField(cat, 'name', lang)}
                    </h3>
                    <span className="text-[11px] text-white/60 uppercase tracking-widest font-medium mt-1 block opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                      {t.hero.shopNow} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== NEW ARRIVALS ==================== */}
      {newArrivals.length > 0 && (
        <section className="py-14 md:py-20 border-t border-brand-border">
          <div className="container-main">
            <SectionHeader title={t.home.newArrivals} link="/products?sort=newest" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10">
              {newArrivals.map(product => (
                <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
              ))}
            </div>
            <div className="sm:hidden mt-8 text-center">
              <Link to="/products?sort=newest" className="btn-outline text-xs">{t.home.viewAll}</Link>
            </div>
          </div>
        </section>
      )}

      {/* ==================== PROMO BANNER ==================== */}
      {promos.length > 0 && (
        <section className="py-4 md:py-8">
          <div className="container-main">
            <div className="relative overflow-hidden bg-[#f5f5f5]">
              {promos[0].link ? (
                <Link to={promos[0].link} className="block">
                  <img
                    src={promos[0].image_url}
                    alt={getLocalizedField(promos[0], 'title', lang)}
                    loading="lazy"
                    className="w-full h-auto transition-transform duration-700 hover:scale-[1.02]"
                  />
                </Link>
              ) : (
                <img
                  src={promos[0].image_url}
                  alt={getLocalizedField(promos[0], 'title', lang)}
                  loading="lazy"
                  className="w-full h-auto"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==================== FEATURED PRODUCTS ==================== */}
      {featuredProducts.length > 0 && (
        <section className="py-14 md:py-20 border-t border-brand-border">
          <div className="container-main">
            <SectionHeader title={t.home.featuredProducts} link="/products?sort=featured" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== OFFERS / SALE ==================== */}
      {saleProducts.length > 0 && (
        <section className="py-14 md:py-20 bg-[#FAF8F7]">
          <div className="container-main">
            <SectionHeader title={t.home.offers} link="/products" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10">
              {saleProducts.map(product => (
                <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== TESTIMONIALS ==================== */}
      {testimonials.length > 0 && (
        <section className="py-14 md:py-20 border-t border-brand-border">
          <div className="container-main">
            <div className="text-center mb-10 md:mb-12">
              <div className="section-label mb-2">WWenatou</div>
              <h2 className="section-title">
                {lang === 'ar' ? 'آراء عميلاتنا' : 'Avis de nos clientes'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map(item => (
                <div key={item.id} className="border border-brand-border p-6 md:p-8">
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} className={i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                  <p className="text-[13px] text-brand-text-secondary leading-relaxed mb-5">
                    &ldquo;{getLocalizedField(item, 'content', lang)}&rdquo;
                  </p>
                  <p className="text-sm font-semibold text-brand-text">{getLocalizedField(item, 'name', lang)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </>
  );
}
