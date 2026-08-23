import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { Product } from '../../utils/types';
import { formatPrice, getLocalizedField, getDiscountPercentage } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: Props) {
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const name = getLocalizedField(product, 'name', lang);
  const primaryImage = product.images?.find(i => i.is_primary) || product.images?.[0];
  const secondImage = product.images?.find(i => !i.is_primary && i.id !== primaryImage?.id);
  const discount = product.old_price ? getDiscountPercentage(product.price, product.old_price) : 0;
  const wishlisted = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.is_available) return;
    addItem(product, 1);
    toast.success(t.cart.itemAdded);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast.success(wishlisted ? t.wishlist.removedFromWishlist : t.wishlist.addedToWishlist);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <div
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/products/${product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5] mb-4">
          {!imageLoaded && primaryImage && <div className="absolute inset-0 img-loading" />}

          {primaryImage && (
            <img
              src={primaryImage.image_url}
              alt={name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } ${hovered && secondImage ? 'opacity-0 scale-[1.03]' : 'group-hover:scale-[1.03]'}`}
            />
          )}

          {secondImage && (
            <img
              src={secondImage.image_url}
              alt={name}
              loading="lazy"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'
              }`}
            />
          )}

          {/* Badges — top start */}
          <div className="absolute top-3 start-3 flex flex-col gap-1.5 z-[2]">
            {discount > 0 && (
              <span className="bg-brand-text text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 uppercase">
                -{discount}%
              </span>
            )}
            {product.is_new_arrival && (
              <span className="bg-white text-brand-text text-[10px] font-semibold tracking-wide px-2.5 py-1 uppercase">
                {t.product.newArrival}
              </span>
            )}
          </div>

          {/* Wishlist — top end (always visible on mobile) */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 end-3 z-[2] w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
              ${wishlisted
                ? 'bg-primary text-white shadow-md'
                : 'bg-white/90 text-brand-text shadow-sm backdrop-blur-sm md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0'
              }`}
            aria-label={t.product.addToWishlist}
          >
            <Heart size={15} strokeWidth={wishlisted ? 0 : 1.5} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Unavailable overlay */}
          {!product.is_available && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-[1]">
              <span className="text-brand-text text-xs font-semibold tracking-wide uppercase bg-white px-4 py-2">
                {t.product.unavailable}
              </span>
            </div>
          )}

          {/* Bottom action bar — slides up on hover */}
          {product.is_available && (
            <div
              className={`absolute bottom-0 inset-x-0 z-[2] transition-all duration-300 ease-out ${
                hovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            >
              <div className="flex">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-brand-text/90 backdrop-blur-sm text-white text-[11px] font-semibold uppercase tracking-widest py-3.5 hover:bg-brand-text transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={14} strokeWidth={1.5} />
                  {t.product.addToCart}
                </button>
                {onQuickView && (
                  <button
                    onClick={handleQuickView}
                    className="bg-brand-text/90 backdrop-blur-sm text-white px-4 hover:bg-brand-text transition-colors border-s border-white/20"
                    aria-label={t.product.quickView}
                  >
                    <Eye size={15} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          {product.category && (
            <p className="section-label">
              {getLocalizedField(product.category, 'name', lang)}
            </p>
          )}
          <h3 className="text-[13px] sm:text-sm font-medium text-brand-text leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {name}
          </h3>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-sm font-bold text-brand-text">
              {formatPrice(product.price)} <span className="text-xs font-normal">{t.common.currency}</span>
            </span>
            {product.old_price && product.old_price > product.price && (
              <span className="text-xs text-brand-text-muted line-through">
                {formatPrice(product.old_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
