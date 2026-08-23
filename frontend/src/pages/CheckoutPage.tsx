import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { publicApi } from '../services/api';
import { formatPrice, getLocalizedField, isValidPhone } from '../utils/helpers';

interface FormData {
  fullName: string;
  phone: string;
  province: string;
  address: string;
  notes: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  province?: string;
  address?: string;
}

interface CouponData {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
}

export default function CheckoutPage() {
  const { lang, t, dir } = useLanguage();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    fullName: '',
    phone: '',
    province: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Redirect to cart if empty and not showing success
  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      navigate('/cart');
    }
  }, [items.length, orderSuccess, navigate]);

  const provinceKeys = Object.keys(t.provinces) as (keyof typeof t.provinces)[];

  const discountAmount = coupon ? coupon.discount_amount : 0;
  const total = subtotal - discountAmount;

  const updateField = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = t.checkout.required;
    }
    if (!form.phone.trim()) {
      newErrors.phone = t.checkout.required;
    } else if (!isValidPhone(form.phone)) {
      newErrors.phone = t.checkout.invalidPhone;
    }
    if (!form.province) {
      newErrors.province = t.checkout.required;
    }
    if (!form.address.trim()) {
      newErrors.address = t.checkout.required;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const result = await publicApi.validateCoupon(couponCode.trim(), subtotal);
      setCoupon({
        code: couponCode.trim(),
        discount_type: result.discount_type,
        discount_value: result.discount_value,
        discount_amount: result.discount_amount,
      });
      toast.success(t.checkout.couponApplied);
    } catch {
      setCoupon(null);
      toast.error(t.checkout.couponInvalid);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        product_name_ar: item.product.name_ar,
        product_name_fr: item.product.name_fr,
        product_image: item.product.images?.find(i => i.is_primary)?.image_url || item.product.images?.[0]?.image_url || null,
        price: item.product.price,
        quantity: item.quantity,
        color_name_ar: item.selectedColor?.name_ar || null,
        color_name_fr: item.selectedColor?.name_fr || null,
        color_hex: item.selectedColor?.hex_code || null,
        size: item.selectedSize?.size || null,
      }));

      const orderData = {
        customer_name: form.fullName.trim(),
        customer_phone: form.phone.trim(),
        customer_province: form.province,
        customer_address: form.address.trim(),
        customer_notes: form.notes.trim() || null,
        subtotal,
        discount_amount: discountAmount,
        total,
        coupon_code: coupon?.code || null,
        items: orderItems,
      };

      const result = await publicApi.createOrder(orderData);
      setOrderNumber(result.order_number);
      setOrderSuccess(true);
      clearCart();
    } catch {
      toast.error(t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (orderSuccess) {
    return (
      <>
        <Helmet>
          <title>{t.checkout.orderSuccess} | WWenatou Shopping</title>
        </Helmet>

        <div className="container-main py-16 min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text mb-3">
              {t.checkout.orderSuccess}
            </h1>
            <div className="bg-gray-50 rounded-md p-4 mb-6">
              <p className="text-sm text-brand-text-secondary mb-1">{t.checkout.orderNumber}</p>
              <p className="text-xl font-bold text-brand-text">{orderNumber}</p>
            </div>
            <p className="text-brand-text-secondary mb-8">{t.checkout.deliveryInfo}</p>
            <Link
              to="/products"
              className="btn-primary inline-flex items-center gap-2"
            >
              <ShoppingBag size={18} />
              {t.cart.continueShopping}
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Don't render checkout form if cart is empty (will redirect)
  if (items.length === 0) return null;

  return (
    <>
      <Helmet>
        <title>{t.checkout.title} | WWenatou Shopping</title>
      </Helmet>

      <div className="container-main py-8 md:py-12 min-h-[60vh]">
        <h1 className="section-title mb-8">{t.checkout.title}</h1>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Customer Info Form */}
          <div className={`lg:col-span-2 mb-8 lg:mb-0 ${dir === 'rtl' ? 'lg:order-1' : 'lg:order-1'}`}>
            {/* Customer Information */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-brand-text mb-4">{t.checkout.customerInfo}</h2>
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">
                    {t.checkout.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => updateField('fullName', e.target.value)}
                    className={`input-field ${errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">
                    {t.checkout.phone} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    className={`input-field ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    dir="ltr"
                    placeholder="+222 XXXXXXXX"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Province */}
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">
                    {t.checkout.province} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.province}
                    onChange={e => updateField('province', e.target.value)}
                    className={`input-field ${errors.province ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  >
                    <option value="">{t.checkout.province}</option>
                    {provinceKeys.map(key => (
                      <option key={key} value={key}>
                        {t.provinces[key]}
                      </option>
                    ))}
                  </select>
                  {errors.province && (
                    <p className="text-red-500 text-xs mt-1">{errors.province}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">
                    {t.checkout.address} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.address}
                    onChange={e => updateField('address', e.target.value)}
                    rows={3}
                    className={`input-field resize-none ${errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">
                    {t.checkout.notes}
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={e => updateField('notes', e.target.value)}
                    rows={2}
                    className="input-field resize-none"
                    placeholder={t.checkout.notesPlaceholder}
                  />
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-brand-text mb-4">{t.checkout.couponCode}</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  className="input-field flex-1"
                  placeholder={t.checkout.couponCode}
                  dir="ltr"
                  disabled={!!coupon}
                />
                {coupon ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCoupon(null);
                      setCouponCode('');
                    }}
                    className="btn-outline px-4 py-3 text-sm shrink-0"
                  >
                    {t.cart.remove}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn-primary px-4 py-3 text-sm shrink-0 disabled:opacity-50"
                  >
                    {t.checkout.applyCoupon}
                  </button>
                )}
              </div>
              {coupon && (
                <p className="text-green-600 text-sm mt-2">
                  {t.checkout.couponApplied} (-{formatPrice(discountAmount)} {t.common.currency})
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-brand-text mb-4">{t.checkout.paymentMethod}</h2>
              <label className="flex items-center gap-3 border border-primary bg-primary/5 rounded-md p-4 cursor-pointer">
                <span className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                </span>
                <span className="text-sm font-medium text-brand-text">{t.checkout.cashOnDelivery}</span>
              </label>
            </div>

            {/* Delivery Info */}
            <div className="bg-gray-50 rounded-md p-4 mb-8 lg:mb-0">
              <p className="text-sm text-brand-text-secondary">{t.checkout.deliveryInfo}</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className={`lg:col-span-1 ${dir === 'rtl' ? 'lg:order-2' : 'lg:order-2'}`}>
            <div className="bg-gray-50 p-6 sticky top-24 rounded-md">
              <h2 className="text-lg font-bold text-brand-text mb-4">{t.checkout.orderSummary}</h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {items.map(item => {
                  const name = getLocalizedField(item.product, 'name', lang);
                  const image = item.product.images?.find(i => i.is_primary) || item.product.images?.[0];
                  const colorName = item.selectedColor ? getLocalizedField(item.selectedColor, 'name', lang) : '';
                  const lineTotal = item.product.price * item.quantity;

                  return (
                    <div
                      key={`${item.product.id}-${item.selectedColor?.id}-${item.selectedSize?.id}`}
                      className="flex gap-3 pb-3 border-b border-brand-border last:border-0"
                    >
                      <div className="w-14 h-16 bg-gray-100 overflow-hidden rounded shrink-0">
                        {image && (
                          <img
                            src={image.image_url}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-text line-clamp-1">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-brand-text-secondary">
                          {item.selectedColor && (
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-gray-200"
                                style={{ backgroundColor: item.selectedColor.hex_code }}
                              />
                              {colorName}
                            </span>
                          )}
                          {item.selectedSize && <span>{item.selectedSize.size}</span>}
                          <span>x{item.quantity}</span>
                        </div>
                        <p className="text-sm font-bold text-brand-text mt-1">
                          {formatPrice(lineTotal)} {t.common.currency}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-text-secondary">{t.cart.subtotal}</span>
                  <span className="font-medium">{formatPrice(subtotal)} {t.common.currency}</span>
                </div>

                {coupon && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>{t.checkout.couponCode}</span>
                    <span>-{formatPrice(discountAmount)} {t.common.currency}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm pt-3 border-t border-brand-border">
                  <span className="font-bold text-brand-text">{t.cart.total}</span>
                  <span className="font-bold text-brand-text text-lg">
                    {formatPrice(total)} {t.common.currency}
                  </span>
                </div>
              </div>

              {/* Place Order */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? t.checkout.processing : t.checkout.placeOrder}
              </button>

              <Link
                to="/cart"
                className="block text-center text-sm text-brand-text-secondary hover:text-primary mt-4 transition-colors"
              >
                {t.common.back}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
