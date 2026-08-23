import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { Product, ProductColor, ProductSize } from '../../utils/types';
import { formatPrice, getLocalizedField, getDiscountPercentage } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: Props) {
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>(product.colors?.[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(product.sizes?.[0]);
  const [quantity, setQuantity] = useState(1);

  const name = getLocalizedField(product, 'name', lang);
  const description = getLocalizedField(product, 'description', lang);
  const primaryImage = product.images?.find(i => i.is_primary) || product.images?.[0];
  const discount = product.old_price ? getDiscountPercentage(product.price, product.old_price) : 0;

  const handleAddToCart = () => {
    if (!product.is_available) return;
    addItem(product, quantity, selectedColor, selectedSize);
    toast.success(t.cart.itemAdded);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-[820px] max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Image */}
          <div className="aspect-[3/4] sm:aspect-auto sm:min-h-[500px] bg-[#f5f5f5]">
            {primaryImage && (
              <img src={primaryImage.image_url} alt={name} className="w-full h-full object-cover" />
            )}
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col">
            {product.category && (
              <p className="section-label mb-2">{getLocalizedField(product.category, 'name', lang)}</p>
            )}

            <h2 className="text-lg font-bold text-brand-text leading-snug mb-3">{name}</h2>

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-xl font-bold text-brand-text">
                {formatPrice(product.price)} <span className="text-xs font-normal">{t.common.currency}</span>
              </span>
              {product.old_price && (
                <>
                  <span className="text-sm text-brand-text-muted line-through">
                    {formatPrice(product.old_price)}
                  </span>
                  {discount > 0 && (
                    <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5">
                      -{discount}%
                    </span>
                  )}
                </>
              )}
            </div>

            {description && (
              <p className="text-[13px] text-brand-text-secondary leading-relaxed mb-5 line-clamp-3">{description}</p>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-5">
                <label className="section-label mb-2.5 block">
                  {t.product.color}{selectedColor ? `: ${getLocalizedField(selectedColor, 'name', lang)}` : ''}
                </label>
                <div className="flex items-center gap-2.5">
                  {product.colors.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
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

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-5">
                <label className="section-label mb-2.5 block">{t.product.size}</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
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

            {/* Quantity */}
            <div className="mb-6">
              <label className="section-label mb-2.5 block">{t.product.quantity}</label>
              <div className="inline-flex items-center border border-brand-border">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 h-10 flex items-center justify-center text-sm font-medium border-x border-brand-border">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={!product.is_available}
              className="btn-primary w-full gap-2.5 mt-auto disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={16} strokeWidth={1.5} />
              {product.is_available ? t.product.addToCart : t.product.unavailable}
            </button>

            <Link
              to={`/products/${product.id}`}
              onClick={onClose}
              className="text-center text-[13px] text-brand-text-secondary mt-3 link-underline inline-block mx-auto"
            >
              {t.product.description}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
