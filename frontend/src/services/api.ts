const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('wwenatou_admin_token');
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// Public API
export const publicApi = {
  getProducts: (params?: string) => request<any>(`/products${params ? `?${params}` : ''}`),
  getProduct: (id: string) => request<any>(`/products/${id}`),
  getCategories: () => request<any>('/categories'),
  getHomepage: () => request<any>('/homepage'),
  getSettings: () => request<any>('/settings'),
  createOrder: (data: any) => request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  validateCoupon: (code: string, subtotal: number) =>
    request<any>('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),
};

// Admin API
export const adminApi = {
  login: (email: string, password: string) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  verifyToken: () => request<any>('/auth/verify'),

  // Dashboard
  getDashboard: () => request<any>('/admin/dashboard'),

  // Products
  getProducts: (params?: string) => request<any>(`/admin/products${params ? `?${params}` : ''}`),
  getProduct: (id: string) => request<any>(`/admin/products/${id}`),
  createProduct: (data: FormData) => request<any>('/admin/products', { method: 'POST', body: data }),
  updateProduct: (id: string, data: FormData) => request<any>(`/admin/products/${id}`, { method: 'PUT', body: data }),
  deleteProduct: (id: string) => request<any>(`/admin/products/${id}`, { method: 'DELETE' }),
  deleteProductImage: (imageId: string) => request<any>(`/admin/product-images/${imageId}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request<any>('/admin/categories'),
  createCategory: (data: FormData) => request<any>('/admin/categories', { method: 'POST', body: data }),
  updateCategory: (id: string, data: FormData) => request<any>(`/admin/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id: string) => request<any>(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params?: string) => request<any>(`/admin/orders${params ? `?${params}` : ''}`),
  getOrder: (id: string) => request<any>(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Customers
  getCustomers: (params?: string) => request<any>(`/admin/customers${params ? `?${params}` : ''}`),

  // Coupons
  getCoupons: () => request<any>('/admin/coupons'),
  createCoupon: (data: any) => request<any>('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
  updateCoupon: (id: string, data: any) =>
    request<any>(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoupon: (id: string) => request<any>(`/admin/coupons/${id}`, { method: 'DELETE' }),

  // Homepage
  getHeroBanners: () => request<any>('/admin/hero-banners'),
  createHeroBanner: (data: FormData) => request<any>('/admin/hero-banners', { method: 'POST', body: data }),
  updateHeroBanner: (id: string, data: FormData) =>
    request<any>(`/admin/hero-banners/${id}`, { method: 'PUT', body: data }),
  deleteHeroBanner: (id: string) => request<any>(`/admin/hero-banners/${id}`, { method: 'DELETE' }),

  getPromoBanners: () => request<any>('/admin/promo-banners'),
  createPromoBanner: (data: FormData) => request<any>('/admin/promo-banners', { method: 'POST', body: data }),
  updatePromoBanner: (id: string, data: FormData) =>
    request<any>(`/admin/promo-banners/${id}`, { method: 'PUT', body: data }),
  deletePromoBanner: (id: string) => request<any>(`/admin/promo-banners/${id}`, { method: 'DELETE' }),

  // Testimonials
  getTestimonials: () => request<any>('/admin/testimonials'),
  createTestimonial: (data: any) =>
    request<any>('/admin/testimonials', { method: 'POST', body: JSON.stringify(data) }),
  updateTestimonial: (id: string, data: any) =>
    request<any>(`/admin/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTestimonial: (id: string) => request<any>(`/admin/testimonials/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<any>('/admin/settings'),
  updateSettings: (data: FormData) => request<any>('/admin/settings', { method: 'PUT', body: data }),
};
