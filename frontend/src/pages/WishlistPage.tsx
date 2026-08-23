import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { formatPrice, getLocalizedField } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { lang, t } = useLanguage();
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  const handleMoveToCart = (product: typeof items[0]) => {
    addItem(product, 1);
    removeItem(product.id);
    toast.success(t.cart.itemAdded);
  };

  return (
    <>
      <Helmet>
        <title>{t.wishlist.title} | WWenatou Shopping</title>
      </Helmet>

      <div className="container-main py-8 md:py-12 min-h-[60vh]">
        <h1 className="section-title mb-8">{t.wishlist.title}</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-brand-text-secondary mb-6">{t.wishlist.empty}</p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              {t.cart.continueShopping}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {items.map(product => {
              const name = getLocalizedField(product, 'name', lang);
              const image = product.images?.find(i => i.is_primary) || product.images?.[0];

              return (
                <div key={product.id} className="group border border-brand-border">
                  {/* Image */}
                  <Link to={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-gray-100">
                    {image && (
                      <img src={image.image_url} alt={name} className="w-full h-full object-cover" loading="lazy" />
                    )}
                    {!product.is_available && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1">
                          {t.product.unavailable}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <Link to={`/products/${product.id}`} className="block">
                      <h3 className="text-sm font-medium text-brand-text line-clamp-2 hover:text-primary transition-colors mb-2">
                        {name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-bold text-brand-text">
                        {formatPrice(product.price)} {t.common.currency}
                      </span>
                      {product.old_price && (
                        <span className="text-xs text-brand-text-secondary line-through">
                          {formatPrice(product.old_price)} {t.common.currency}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {product.is_available && (
                        <button
                          onClick={() => handleMoveToCart(product)}
                          className="btn-primary flex-1 flex items-center justify-center gap-2 !py-2.5 text-sm"
                        >
                          <ShoppingBag size={14} />
                          {t.wishlist.moveToCart}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          removeItem(product.id);
                          toast.success(t.wishlist.removedFromWishlist);
                        }}
                        className="p-2.5 border border-brand-border text-brand-text-secondary hover:text-red-500 hover:border-red-500 transition-colors"
                        aria-label={t.common.delete}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
