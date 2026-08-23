import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { publicApi } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import QuickViewModal from '../components/common/QuickViewModal';
import { PageLoader } from '../components/common/LoadingSpinner';
import { Product, Category } from '../utils/types';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PRODUCTS_PER_PAGE = 12;

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'featured';

export default function ProductsPage() {
  const { lang, dir, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- State from URL ---
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'newest');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.get('size') ? searchParams.get('size')!.split(',') : []
  );
  const [selectedColor, setSelectedColor] = useState(searchParams.get('color') || '');

  // --- Data state ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // --- UI state ---
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  // --- Fetch categories ---
  useEffect(() => {
    publicApi.getCategories()
      .then((data: any) => {
        setCategories(Array.isArray(data) ? data : data.categories || []);
      })
      .catch(() => {
        toast.error(t.common.error);
      });
  }, [t.common.error]);

  // --- Build query params string ---
  const buildQueryParams = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory) params.set('category', selectedCategory);
      if (sort) params.set('sort', sort);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (selectedSizes.length > 0) params.set('size', selectedSizes.join(','));
      if (selectedColor) params.set('color', selectedColor);
      params.set('page', String(pageNum));
      params.set('limit', String(PRODUCTS_PER_PAGE));
      return params.toString();
    },
    [search, selectedCategory, sort, minPrice, maxPrice, selectedSizes, selectedColor]
  );

  // --- Sync filters to URL ---
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (selectedSizes.length > 0) params.set('size', selectedSizes.join(','));
    if (selectedColor) params.set('color', selectedColor);
    setSearchParams(params, { replace: true });
  }, [search, selectedCategory, sort, minPrice, maxPrice, selectedSizes, selectedColor, setSearchParams]);

  // --- Fetch products ---
  const fetchProducts = useCallback(
    async (pageNum: number, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await publicApi.getProducts(buildQueryParams(pageNum));
        const fetched: Product[] = Array.isArray(data) ? data : data.products || [];
        const total: number = data.total ?? fetched.length;

        if (append) {
          setProducts(prev => [...prev, ...fetched]);
        } else {
          setProducts(fetched);
          setTotalCount(total);
        }

        setHasMore(
          Array.isArray(data)
            ? fetched.length === PRODUCTS_PER_PAGE
            : pageNum * PRODUCTS_PER_PAGE < total
        );
        setPage(pageNum);
      } catch {
        toast.error(t.common.error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQueryParams, t.common.error]
  );

  // --- Refetch on filter change (reset to page 1) ---
  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  // --- Load more ---
  const handleLoadMore = () => {
    fetchProducts(page + 1, true);
  };

  // --- Search submit ---
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  // --- Size toggle ---
  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  // --- Clear all filters ---
  const clearAllFilters = () => {
    setSearch('');
    setSearchInput('');
    setSelectedCategory('');
    setSort('newest');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSizes([]);
    setSelectedColor('');
  };

  const hasActiveFilters =
    !!search ||
    !!selectedCategory ||
    sort !== 'newest' ||
    !!minPrice ||
    !!maxPrice ||
    selectedSizes.length > 0 ||
    !!selectedColor;

  // --- Sort labels ---
  const sortLabels: Record<SortOption, string> = {
    newest: t.filter.sortNewest,
    price_asc: t.filter.sortPriceLow,
    price_desc: t.filter.sortPriceHigh,
    featured: t.filter.sortFeatured,
  };

  // --- Localized category name ---
  const getCategoryName = (cat: Category) =>
    lang === 'ar' ? cat.name_ar : cat.name_fr;

  // ==================== FILTER PANEL (shared between desktop & mobile) ====================
  const FilterContent = ({ onApply }: { onApply?: () => void }) => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="section-label mb-3">
          {t.filter.category}
        </h3>
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={() => {
                setSelectedCategory('');
                onApply?.();
              }}
              className={`w-full text-start text-sm px-2 py-1.5 rounded transition-colors ${
                !selectedCategory
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-brand-text-secondary hover:text-brand-text hover:bg-gray-50'
              }`}
            >
              {t.filter.allCategories}
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat.id}>
              <button
                onClick={() => {
                  setSelectedCategory(cat.id);
                  onApply?.();
                }}
                className={`w-full text-start text-sm px-2 py-1.5 rounded transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-brand-text-secondary hover:text-brand-text hover:bg-gray-50'
                }`}
              >
                {getCategoryName(cat)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="section-label mb-3">
          {t.filter.priceRange}
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder={t.filter.minPrice}
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="w-full border border-brand-border rounded-sm px-2.5 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <span className="text-brand-text-secondary text-sm shrink-0">-</span>
          <input
            type="number"
            min="0"
            placeholder={t.filter.maxPrice}
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="w-full border border-brand-border rounded-sm px-2.5 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="section-label mb-3">
          {t.filter.size}
        </h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(size => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`min-w-[42px] h-9 px-2.5 border text-xs font-medium transition-colors ${
                selectedSizes.includes(size)
                  ? 'border-primary bg-primary text-white'
                  : 'border-brand-border text-brand-text hover:border-primary'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="section-label mb-3">
          {t.filter.color}
        </h3>
        <input
          type="text"
          placeholder={t.filter.color}
          value={selectedColor}
          onChange={e => setSelectedColor(e.target.value)}
          className="w-full border border-brand-border rounded-sm px-2.5 py-2 text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            clearAllFilters();
            onApply?.();
          }}
          className="w-full text-sm text-primary hover:text-primary/80 font-medium py-2 transition-colors"
        >
          {t.filter.clearAll}
        </button>
      )}
    </div>
  );

  // ==================== RENDER ====================
  return (
    <>
      <Helmet>
        <title>{t.nav.products} | WWenatou Shopping</title>
      </Helmet>

      <div dir={dir} className="min-h-screen bg-white">
        {/* Page Header */}
        <div className="border-b border-brand-border">
          <div className="container-main py-8 md:py-12 text-center">
            <p className="section-label mb-2">WWenatou</p>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text tracking-tight mb-5">{t.nav.products}</h1>
            <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto relative">
              <Search size={17} strokeWidth={1.5} className="absolute start-4 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={t.nav.search}
                className="w-full border-b border-brand-border bg-transparent ps-11 pe-9 py-3 text-sm focus:outline-none focus:border-brand-text transition-colors placeholder:text-brand-text-muted"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text">
                  <X size={15} />
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="container-main py-6 md:py-8">

          {/* ===== Toolbar: Mobile filter button + Sort + Results count ===== */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 border border-brand-border px-4 py-2.5 text-[13px] font-medium text-brand-text hover:border-brand-text transition-colors"
              >
                <SlidersHorizontal size={15} strokeWidth={1.5} />
                {t.filter.title}
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </button>

              {/* Results count */}
              {!loading && (
                <span className="text-sm text-brand-text-secondary">
                  {totalCount > 0
                    ? `${totalCount} ${t.nav.products.toLowerCase?.() ?? t.nav.products}`
                    : ''}
                </span>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 border border-brand-border px-4 py-2.5 text-[13px] font-medium text-brand-text hover:border-brand-text transition-colors"
              >
                {t.filter.sort}: {sortLabels[sort]}
                <ChevronDown
                  size={14}
                  className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {sortOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSortOpen(false)}
                  />
                  <div className="absolute end-0 top-full mt-1 bg-white border border-brand-border rounded-sm shadow-lg z-20 min-w-[200px]">
                    {(Object.keys(sortLabels) as SortOption[]).map(key => (
                      <button
                        key={key}
                        onClick={() => {
                          setSort(key);
                          setSortOpen(false);
                        }}
                        className={`w-full text-start px-4 py-2.5 text-sm transition-colors ${
                          sort === key
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-brand-text hover:bg-gray-50'
                        }`}
                      >
                        {sortLabels[key]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ===== Main Layout: Sidebar + Grid ===== */}
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-[220px] shrink-0">
              <div className="sticky top-24">
                <FilterContent />
              </div>
            </aside>

            {/* Products Area */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <PageLoader />
              ) : products.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-brand-text mb-2">
                    {t.product.noProducts}
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-primary hover:text-primary/80 font-medium mt-2"
                    >
                      {t.filter.clearAll}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Product Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10">
                    {products.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={setQuickViewProduct}
                      />
                    ))}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="flex justify-center mt-12">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="btn-outline disabled:opacity-50"
                      >
                        {loadingMore ? t.common.loading : t.common.next}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Mobile Filter Sheet ===== */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" dir={dir}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />

          {/* Slide-up panel */}
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-xl shadow-2xl flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
              <h2 className="text-base font-bold text-brand-text">{t.filter.title}</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterContent onApply={() => setMobileFiltersOpen(false)} />
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-brand-border shrink-0">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary w-full py-2.5 text-sm"
              >
                {t.filter.apply}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== QuickView Modal ===== */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      {/* Inline animation style for the slide-up panel */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
