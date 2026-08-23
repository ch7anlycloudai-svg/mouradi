import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { formatPrice, getLocalizedField } from '../utils/helpers';

export default function CartPage() {
  const { lang, t, dir } = useLanguage();
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <>
      <Helmet>
        <title>{t.cart.title} | WWenatou Shopping</title>
      </Helmet>

      <div className="container-main py-8 md:py-14 min-h-[60vh]">
        {/* Page Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="section-label mb-2">WWenatou</p>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-text tracking-tight">{t.cart.title}</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 max-w-sm mx-auto">
            <ShoppingBag size={40} strokeWidth={1} className="mx-auto text-brand-border mb-5" />
            <p className="text-sm text-brand-text-secondary mb-6">{t.cart.empty}</p>
            <Link to="/products" className="btn-primary gap-2">
              {t.cart.continueShopping}
              <ArrowIcon size={14} />
            </Link>
          </div>
        ) : (
          <div className="lg:flex lg:gap-12">
            {/* Cart Items */}
            <div className="flex-1 min-w-0 mb-10 lg:mb-0">
              {/* Desktop Header */}
              <div className="hidden md:flex items-center pb-4 border-b border-brand-border text-[11px] font-semibold text-brand-text-muted uppercase tracking-widest">
                <div className="flex-1">{t.nav.products}</div>
                <div className="w-28 text-center">{t.product.quantity}</div>
                <div className="w-32 text-end">{t.cart.total}</div>
              </div>

              <div className="divide-y divide-brand-border">
                {items.map(item => {
                  const name = getLocalizedField(item.product, 'name', lang);
                  const image = item.product.images?.find(i => i.is_primary) || item.product.images?.[0];
                  const colorName = item.selectedColor ? getLocalizedField(item.selectedColor, 'name', lang) : '';
                  const lineTotal = item.product.price * item.quantity;
                  const itemKey = `${item.product.id}-${item.selectedColor?.id}-${item.selectedSize?.id}`;

                  return (
                    <div key={itemKey} className="flex items-start gap-4 py-6">
                      {/* Image */}
                      <Link to={`/products/${item.product.id}`} className="shrink-0">
                        <div className="w-20 h-24 sm:w-24 sm:h-32 bg-[#f5f5f5] overflow-hidden">
                          {image && <img src={image.image_url} alt={name} className="w-full h-full object-cover" />}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item.product.id}`} className="block">
                          <h3 className="text-sm font-medium text-brand-text hover:text-primary transition-colors line-clamp-2 mb-1">{name}</h3>
                        </Link>
                        <p className="text-sm font-semibold text-brand-text mb-1.5">
                          {formatPrice(item.product.price)} <span className="text-xs font-normal">{t.common.currency}</span>
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-brand-text-muted">
                          {item.selectedColor && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: item.selectedColor.hex_code }} />
                              {colorName}
                            </span>
                          )}
                          {item.selectedSize && <span>{t.product.size}: {item.selectedSize.size}</span>}
                        </div>

                        {/* Mobile: qty + remove */}
                        <div className="flex items-center justify-between mt-3 md:hidden">
                          <div className="inline-flex items-center border border-brand-border">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedColor?.id, item.selectedSize?.id)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center text-brand-text-secondary disabled:opacity-30"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 h-8 flex items-center justify-center text-xs font-medium border-x border-brand-border">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedColor?.id, item.selectedSize?.id)}
                              className="w-8 h-8 flex items-center justify-center text-brand-text-secondary"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-bold">{formatPrice(lineTotal)} {t.common.currency}</span>
                        </div>
                      </div>

                      {/* Desktop: qty */}
                      <div className="hidden md:flex items-center w-28 justify-center">
                        <div className="inline-flex items-center border border-brand-border">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedColor?.id, item.selectedSize?.id)}
                            disabled={item.quantity <= 1}
                            className="w-9 h-9 flex items-center justify-center text-brand-text-secondary hover:text-brand-text disabled:opacity-30"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-10 h-9 flex items-center justify-center text-sm font-medium border-x border-brand-border">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedColor?.id, item.selectedSize?.id)}
                            className="w-9 h-9 flex items-center justify-center text-brand-text-secondary hover:text-brand-text"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Desktop: total + remove */}
                      <div className="hidden md:flex items-center w-32 justify-end gap-3">
                        <span className="text-sm font-bold text-brand-text">{formatPrice(lineTotal)} {t.common.currency}</span>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedColor?.id, item.selectedSize?.id)}
                          className="text-brand-text-muted hover:text-red-500 transition-colors"
                          aria-label={t.cart.remove}
                        >
                          <Trash2 size={15} strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Mobile remove */}
                      <button
                        onClick={() => removeItem(item.product.id, item.selectedColor?.id, item.selectedSize?.id)}
                        className="md:hidden text-brand-text-muted hover:text-red-500 transition-colors shrink-0 mt-1"
                        aria-label={t.cart.remove}
                      >
                        <X size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:w-[380px] shrink-0">
              <div className="bg-[#FAFAFA] p-6 md:p-8 sticky top-24">
                <h2 className="text-base font-bold text-brand-text mb-6">{t.checkout.orderSummary}</h2>

                <div className="space-y-3 text-sm mb-6 pb-6 border-b border-brand-border">
                  <div className="flex justify-between">
                    <span className="text-brand-text-secondary">{t.cart.subtotal}</span>
                    <span className="font-medium">{formatPrice(subtotal)} {t.common.currency}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline mb-8">
                  <span className="text-base font-bold text-brand-text">{t.cart.total}</span>
                  <span className="text-xl font-bold text-brand-text">{formatPrice(subtotal)} {t.common.currency}</span>
                </div>

                <Link to="/checkout" className="btn-primary w-full gap-2.5">
                  {t.cart.checkout}
                  <ArrowIcon size={15} />
                </Link>

                <Link to="/products" className="block text-center text-[13px] text-brand-text-secondary mt-4 link-underline mx-auto w-fit">
                  {t.cart.continueShopping}
                </Link>

                <p className="text-[11px] text-brand-text-muted mt-6 pt-5 border-t border-brand-border leading-relaxed">
                  {t.checkout.deliveryInfo}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function X({ size, strokeWidth, className }: { size: number; strokeWidth: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
