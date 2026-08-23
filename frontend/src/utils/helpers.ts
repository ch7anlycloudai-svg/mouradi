export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLocalizedField(item: any, field: string, lang: string): string {
  const key = `${field}_${lang}`;
  return item[key] || '';
}

export function getDiscountPercentage(price: number, oldPrice: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WW-${year}-${random}`;
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const base = `https://wa.me/${cleanPhone.replace('+', '')}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^\+?[0-9]{8,15}$/.test(cleaned);
}

const CART_KEY = 'wwenatou_cart';
const WISHLIST_KEY = 'wwenatou_wishlist';
const LANG_KEY = 'wwenatou_lang';

export const storage = {
  getCart: () => {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  setCart: (cart: unknown) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  },
  getWishlist: () => {
    try {
      const data = localStorage.getItem(WISHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  setWishlist: (wishlist: unknown) => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  },
  getLang: (): string => {
    return localStorage.getItem(LANG_KEY) || 'ar';
  },
  setLang: (lang: string) => {
    localStorage.setItem(LANG_KEY, lang);
  },
};
