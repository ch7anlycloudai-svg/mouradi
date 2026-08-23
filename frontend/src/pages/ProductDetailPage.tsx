import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, Minus, Plus, ShoppingBag, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { publicApi } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import { PageLoader } from '../components/common/LoadingSpinner';
import { Product, ProductColor, ProductSize } from '../utils/types';
import { formatPrice, getLocalizedField, getDiscountPercentage } from '../utils/helpers';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, dir, t } = useLanguage();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>();
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>();
  const [quantity, setQuantity] = useState(1);

  // Fetch product
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(false);
    setSelectedImage(0);
    setSelectedColor(undefined);
    setSelectedSize(undefined);
    setQuantity(1);

    publicApi
      .getProduct(id)
      .then((data: any) => {
        const p: Product = data.product || data;
        setProduct(p);

        // Fetch related products from same category
        if (p.category_id) {
          publicApi
            .getProducts(`category_id=${p.category_id}&limit=8`)
            .then((res: any) => {
              const products: Product[] = res.products || res.data || res || [];
              setRelatedProducts(
                Array.isArray(products)
                  ? products.filter((rp: Product) => rp.id !== p.id).slice(0, 4)
                  : []
              );
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });

    // Scroll to top on product change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !product.is_available) return;
    addItem(product, quantity, selectedColor, selectedSize);
    toast.success(t.cart.itemAdded);
  };

  const handleBuyNow = () => {
    if (!product || !product.is_available) return;
    addItem(product, quantity, selectedColor, selectedSize);
    toast.success(t.cart.itemAdded);
    navigate('/checkout');
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    const wishlisted = isInWishlist(product.id);
    toggleWishlist(product);
    toast.success(wishlisted ? t.wishlist.removedFromWishlist : t.wishlist.addedToWishlist);
  };

  const decrementQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  // Loading state
  if (loading) {
    return <PageLoader />;
  }

  // Error / not found state
  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-brand-text-secondary text-lg">{t.common.error}</p>
        <button
          onClick={() => navigate(-1)}
          className="btn-primary px-6 py-2"
        >
          {t.common.back}
        </button>
      </div>
    );
  }

  const name = getLocalizedField(product, 'name', lang);
  const description = getLocalizedField(product, 'description', lang);
  const categoryName = product.category
    ? getLocalizedField(product.category, 'name', lang)
    : '';
  const images = product.images
    ? [...product.images].sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const primaryIndex = images.findIndex((i) => i.is_primary);
  const sortedImages =
    primaryIndex > 0
      ? [images[primaryIndex], ...images.filter((_, idx) => idx !== primaryIndex)]
      : images;

  const discount = product.old_price
    ? getDiscountPercentage(product.price, product.old_price)
    : 0;
  const wishlisted = isInWishlist(product.id);

  const currentImage = sortedImages[selectedImage] || sortedImages[0];

  return (
    <>
      <Helmet>
        <title>{name} - WWenatou Shopping</title>
        <meta name="description" content={description?.substring(0, 160)} />
      </Helmet>

      <div className="container-main py-6 md:py-12">
        {/* Breadcrumb-style back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[13px] text-brand-text-muted hover:text-brand-text transition-colors mb-8"
        >
          <ChevronLeft size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
          <span>{t.common.back}</span>
        </button>

        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14">
          {/* Image Gallery */}
          <div className="space-y-3">
            {/* Main Image */}
            <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f5f5]">
              {currentImage ? (
                <img
                  src={currentImage.image_url}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-text-secondary">
                  <ShoppingBag size={64} strokeWidth={1} />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-3 start-3 flex flex-col gap-1.5">
                {discount > 0 && (
                  <span className="bg-brand-text text-white text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1">
                    -{discount}%
                  </span>
                )}
                {product.is_new_arrival && (
                  <span className="bg-white text-brand-text text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1">
                    {t.product.newArrival}
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {sortedImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sortedImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(index)}
                    className={`relative flex-shrink-0 w-16 h-20 md:w-20 md:h-[100px] overflow-hidden bg-[#f5f5f5] transition-all duration-200 ${
                      selectedImage === index
                        ? 'ring-2 ring-brand-text ring-offset-1'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.image_url} alt={`${name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:pt-2">
            {/* Category */}
            {product.category && (
              <Link
                to={`/products?category=${product.category_id}`}
                className="section-label link-underline inline-block mb-3"
              >
                {categoryName}
              </Link>
            )}

            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text leading-snug tracking-tight mb-4">
              {name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap mb-5">
              <span className="text-2xl font-bold text-brand-text">
                {formatPrice(product.price)} <span className="text-sm font-normal">{t.common.currency}</span>
              </span>
              {product.old_price && (
                <span className="text-base text-brand-text-muted line-through">
                  {formatPrice(product.old_price)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 uppercase tracking-wide">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Availability */}
            <div className="mb-6">
              {product.is_available ? (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-green-700">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {t.product.available}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-red-600">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  {t.product.unavailable}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-[13px] text-brand-text-secondary leading-relaxed whitespace-pre-line mb-6">
                {description}
              </p>
            )}

            {/* Divider */}
            <div className="border-t border-brand-border mb-6" />

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <label className="section-label mb-2.5 block">
                  {t.product.color}{selectedColor ? `: ${getLocalizedField(selectedColor, 'name', lang)}` : ''}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(selectedColor?.id === color.id ? undefined : color)}
                      className={`w-8 h-8 rounded-full transition-all duration-200 ${
                        selectedColor?.id === color.id
                          ? 'ring-2 ring-brand-text ring-offset-2 scale-110'
                          : 'ring-1 ring-gray-200 hover:ring-gray-400'
                      }`}
                      style={{ backgroundColor: color.hex_code }}
                      title={getLocalizedField(color, 'name', lang)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="section-label mb-2.5 block">{t.product.size}</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(selectedSize?.id === size.id ? undefined : size)}
                      className={`min-w-[44px] h-10 px-3.5 text-[13px] font-medium transition-all duration-200 ${
                        selectedSize?.id === size.id
                          ? 'bg-brand-text text-white'
                          : 'border border-brand-border text-brand-text hover:border-brand-text'
                      }`}
                    >
                      {size.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-8">
              <label className="section-label mb-2.5 block">{t.product.quantity}</label>
              <div className="inline-flex items-center border border-brand-border">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 h-10 flex items-center justify-center text-sm font-medium border-x border-brand-border">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  className="w-10 h-10 flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.is_available}
                  className="btn-primary flex-1 gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingBag size={16} strokeWidth={1.5} />
                  {t.product.addToCart}
                </button>
                <button
                  onClick={handleToggleWishlist}
                  className={`w-[52px] h-[52px] flex items-center justify-center border transition-all duration-200 shrink-0 ${
                    wishlisted
                      ? 'bg-primary border-primary text-white'
                      : 'border-brand-border text-brand-text hover:border-brand-text'
                  }`}
                  aria-label={wishlisted ? t.product.removeFromWishlist : t.product.addToWishlist}
                >
                  <Heart size={18} strokeWidth={1.5} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={!product.is_available}
                className="btn-outline w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.product.buyNow}
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24 pt-12 border-t border-brand-border">
            <div className="mb-8 md:mb-10">
              <p className="section-label mb-2">WWenatou</p>
              <h2 className="section-title">{t.product.relatedProducts}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
