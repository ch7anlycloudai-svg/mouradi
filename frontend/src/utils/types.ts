export interface Product {
  id: string;
  name_ar: string;
  name_fr: string;
  description_ar: string;
  description_fr: string;
  price: number;
  old_price: number | null;
  category_id: string;
  is_available: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_on_sale: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
  colors?: ProductColor[];
  sizes?: ProductSize[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductColor {
  id: string;
  product_id: string;
  name_ar: string;
  name_fr: string;
  hex_code: string;
}

export interface ProductSize {
  id: string;
  product_id: string;
  size: string;
}

export interface Category {
  id: string;
  name_ar: string;
  name_fr: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: ProductColor;
  selectedSize?: ProductSize;
}

export interface WishlistItem {
  product: Product;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_province: string;
  customer_address: string;
  customer_notes: string | null;
  subtotal: number;
  discount_amount: number;
  total: number;
  coupon_code: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_ar: string;
  product_name_fr: string;
  product_image: string | null;
  price: number;
  quantity: number;
  color_name_ar: string | null;
  color_name_fr: string | null;
  color_hex: string | null;
  size: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  province: string;
  address: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface HeroBanner {
  id: string;
  image_url: string;
  title_ar: string;
  title_fr: string;
  subtitle_ar: string;
  subtitle_fr: string;
  cta_text_ar: string;
  cta_text_fr: string;
  cta_link: string;
  is_active: boolean;
  sort_order: number;
}

export interface PromoBanner {
  id: string;
  image_url: string;
  title_ar: string;
  title_fr: string;
  link: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Testimonial {
  id: string;
  name_ar: string;
  name_fr: string;
  content_ar: string;
  content_fr: string;
  rating: number;
  is_active: boolean;
  sort_order: number;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  logo_url: string | null;
  whatsapp_number: string;
  phone_number: string;
  email: string;
  address_ar: string;
  address_fr: string;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
}

export interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalRevenue: number;
  recentOrders: Order[];
}
