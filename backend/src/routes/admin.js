const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { isAdmin } = require('../middleware/auth');
const { upload, uploadToSupabase, deleteFromSupabase } = require('../middleware/upload');

router.use(isAdmin);

function normalizeProduct(p) {
  return {
    ...p,
    images: (p.product_images || []).sort((a, b) => a.sort_order - b.sort_order),
    colors: p.product_colors || [],
    sizes: p.product_sizes || [],
    product_images: undefined,
    product_colors: undefined,
    product_sizes: undefined,
  };
}

// DASHBOARD
router.get('/dashboard', async (req, res) => {
  try {
    const [ordersRes, productsRes, customersRes, revenueRes, recentRes] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
    ]);
    const totalRevenue = (revenueRes.data || []).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    return res.json({
      totalOrders: ordersRes.count || 0,
      totalProducts: productsRes.count || 0,
      totalCustomers: customersRes.count || 0,
      totalRevenue,
      recentOrders: recentRes.data || [],
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

// PRODUCTS
router.get('/products', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    let query = supabase
      .from('products')
      .select('*, product_images(*), product_colors(*), product_sizes(*), category:categories(id, name_ar, name_fr)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (search) query = query.or(`name_ar.ilike.%${search}%,name_fr.ilike.%${search}%`);
    if (category) query = query.eq('category_id', category);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.json({ products: (data || []).map(normalizeProduct), total: count || 0, page: pageNum, totalPages: Math.ceil((count || 0) / limitNum) });
  } catch (err) {
    console.error('Admin products error:', err);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('products')
      .select('*, product_images(*), product_colors(*), product_sizes(*), category:categories(id, name_ar, name_fr)')
      .eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Product not found.' });
    return res.json(normalizeProduct(data));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

router.post('/products', upload.array('images', 10), async (req, res) => {
  try {
    const { name_ar, name_fr, description_ar, description_fr, price, old_price, category_id, is_available, is_featured, is_new_arrival, is_on_sale, colors, sizes } = req.body;
    const { data: product, error } = await supabase.from('products').insert({
      name_ar, name_fr, description_ar: description_ar || '', description_fr: description_fr || '',
      price: parseFloat(price), old_price: old_price ? parseFloat(old_price) : null,
      category_id: category_id || null, is_available: is_available !== 'false',
      is_featured: is_featured === 'true', is_new_arrival: is_new_arrival === 'true', is_on_sale: is_on_sale === 'true',
    }).select().single();
    if (error) throw error;
    if (req.files && req.files.length > 0) {
      const imgs = [];
      for (let i = 0; i < req.files.length; i++) {
        const url = await uploadToSupabase(req.files[i], 'images', 'products');
        imgs.push({ product_id: product.id, image_url: url, sort_order: i, is_primary: i === 0 });
      }
      await supabase.from('product_images').insert(imgs);
    }
    if (colors) {
      const arr = typeof colors === 'string' ? JSON.parse(colors) : colors;
      if (Array.isArray(arr) && arr.length > 0) {
        await supabase.from('product_colors').insert(arr.map(c => ({ product_id: product.id, name_ar: c.name_ar || '', name_fr: c.name_fr || '', hex_code: c.hex_code || '#000000' })));
      }
    }
    if (sizes) {
      const arr = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      if (Array.isArray(arr) && arr.length > 0) {
        await supabase.from('product_sizes').insert(arr.map(s => ({ product_id: product.id, size: typeof s === 'string' ? s : s.size })));
      }
    }
    return res.status(201).json({ message: 'Product created.', product });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ error: 'Failed to create product.' });
  }
});

router.put('/products/:id', upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { name_ar, name_fr, description_ar, description_fr, price, old_price, category_id, is_available, is_featured, is_new_arrival, is_on_sale, colors, sizes } = req.body;
    const u = {};
    if (name_ar !== undefined) u.name_ar = name_ar;
    if (name_fr !== undefined) u.name_fr = name_fr;
    if (description_ar !== undefined) u.description_ar = description_ar;
    if (description_fr !== undefined) u.description_fr = description_fr;
    if (price !== undefined) u.price = parseFloat(price);
    if (old_price !== undefined) u.old_price = old_price ? parseFloat(old_price) : null;
    if (category_id !== undefined) u.category_id = category_id || null;
    if (is_available !== undefined) u.is_available = is_available !== 'false';
    if (is_featured !== undefined) u.is_featured = is_featured === 'true';
    if (is_new_arrival !== undefined) u.is_new_arrival = is_new_arrival === 'true';
    if (is_on_sale !== undefined) u.is_on_sale = is_on_sale === 'true';
    const { error } = await supabase.from('products').update(u).eq('id', id);
    if (error) throw error;
    if (req.files && req.files.length > 0) {
      const { data: ex } = await supabase.from('product_images').select('sort_order').eq('product_id', id).order('sort_order', { ascending: false }).limit(1);
      let so = (ex?.[0]?.sort_order ?? -1) + 1;
      const imgs = [];
      for (let i = 0; i < req.files.length; i++) {
        const url = await uploadToSupabase(req.files[i], 'images', 'products');
        imgs.push({ product_id: id, image_url: url, sort_order: so + i, is_primary: false });
      }
      await supabase.from('product_images').insert(imgs);
    }
    if (colors !== undefined) {
      await supabase.from('product_colors').delete().eq('product_id', id);
      const arr = typeof colors === 'string' ? JSON.parse(colors) : colors;
      if (Array.isArray(arr) && arr.length > 0) {
        await supabase.from('product_colors').insert(arr.map(c => ({ product_id: id, name_ar: c.name_ar || '', name_fr: c.name_fr || '', hex_code: c.hex_code || '#000000' })));
      }
    }
    if (sizes !== undefined) {
      await supabase.from('product_sizes').delete().eq('product_id', id);
      const arr = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      if (Array.isArray(arr) && arr.length > 0) {
        await supabase.from('product_sizes').insert(arr.map(s => ({ product_id: id, size: typeof s === 'string' ? s : s.size })));
      }
    }
    return res.json({ message: 'Product updated.' });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const { data: images } = await supabase.from('product_images').select('image_url').eq('product_id', req.params.id);
    if (images) for (const img of images) await deleteFromSupabase(img.image_url);
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Product deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
});

router.delete('/product-images/:id', async (req, res) => {
  try {
    const { data: image } = await supabase.from('product_images').select('image_url').eq('id', req.params.id).single();
    if (image) await deleteFromSupabase(image.image_url);
    const { error } = await supabase.from('product_images').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Image deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete image.' });
  }
});

// CATEGORIES
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return res.json({ categories: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

router.post('/categories', upload.single('image'), async (req, res) => {
  try {
    const { name_ar, name_fr, sort_order } = req.body;
    let image_url = null;
    if (req.file) image_url = await uploadToSupabase(req.file, 'images', 'categories');
    const { data, error } = await supabase.from('categories').insert({ name_ar, name_fr, image_url, sort_order: parseInt(sort_order) || 0 }).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create category.' });
  }
});

router.put('/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const { name_ar, name_fr, sort_order } = req.body;
    const u = {};
    if (name_ar !== undefined) u.name_ar = name_ar;
    if (name_fr !== undefined) u.name_fr = name_fr;
    if (sort_order !== undefined) u.sort_order = parseInt(sort_order) || 0;
    if (req.file) {
      const { data: old } = await supabase.from('categories').select('image_url').eq('id', req.params.id).single();
      if (old?.image_url) await deleteFromSupabase(old.image_url);
      u.image_url = await uploadToSupabase(req.file, 'images', 'categories');
    }
    const { error } = await supabase.from('categories').update(u).eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Category updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update category.' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const { data } = await supabase.from('categories').select('image_url').eq('id', req.params.id).single();
    if (data?.image_url) await deleteFromSupabase(data.image_url);
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Category deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// ORDERS
router.get('/orders', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    let query = supabase.from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
    if (search) query = query.or(`order_number.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_name.ilike.%${search}%`);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.json({ orders: data || [], total: count || 0, page: pageNum, totalPages: Math.ceil((count || 0) / limitNum) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (error || !order) return res.status(404).json({ error: 'Order not found.' });
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    return res.json({ order: { ...order, items: items || [] } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch order.' });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const { error } = await supabase.from('orders').update({ status }).eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Order status updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// CUSTOMERS
router.get('/customers', async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    const enriched = await Promise.all((data || []).map(async (c) => {
      const { data: orders } = await supabase.from('orders').select('total').eq('customer_id', c.id);
      return { ...c, total_orders: orders?.length || 0, total_spent: (orders || []).reduce((s, o) => s + (parseFloat(o.total) || 0), 0) };
    }));
    return res.json({ customers: enriched });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch customers.' });
  }
});

// COUPONS
router.get('/coupons', async (req, res) => {
  try {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ coupons: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch coupons.' });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_uses, is_active, expires_at } = req.body;
    const { data, error } = await supabase.from('coupons').insert({
      code: code.toUpperCase(), discount_type, discount_value: parseFloat(discount_value),
      min_order_amount: min_order_amount ? parseFloat(min_order_amount) : null,
      max_uses: max_uses ? parseInt(max_uses) : null, is_active: is_active !== false, expires_at: expires_at || null,
    }).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create coupon.' });
  }
});

router.put('/coupons/:id', async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_uses, is_active, expires_at } = req.body;
    const u = {};
    if (code !== undefined) u.code = code.toUpperCase();
    if (discount_type !== undefined) u.discount_type = discount_type;
    if (discount_value !== undefined) u.discount_value = parseFloat(discount_value);
    if (min_order_amount !== undefined) u.min_order_amount = min_order_amount ? parseFloat(min_order_amount) : null;
    if (max_uses !== undefined) u.max_uses = max_uses ? parseInt(max_uses) : null;
    if (is_active !== undefined) u.is_active = is_active;
    if (expires_at !== undefined) u.expires_at = expires_at || null;
    const { error } = await supabase.from('coupons').update(u).eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Coupon updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update coupon.' });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Coupon deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete coupon.' });
  }
});

// HERO BANNERS
router.get('/hero-banners', async (req, res) => {
  try {
    const { data, error } = await supabase.from('hero_banners').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return res.json({ banners: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch hero banners.' });
  }
});

router.post('/hero-banners', upload.single('image'), async (req, res) => {
  try {
    const { title_ar, title_fr, subtitle_ar, subtitle_fr, cta_text_ar, cta_text_fr, cta_link, is_active, sort_order } = req.body;
    let image_url = '';
    if (req.file) image_url = await uploadToSupabase(req.file, 'images', 'banners');
    const { data, error } = await supabase.from('hero_banners').insert({
      image_url, title_ar, title_fr, subtitle_ar, subtitle_fr, cta_text_ar, cta_text_fr, cta_link,
      is_active: is_active !== 'false', sort_order: parseInt(sort_order) || 0,
    }).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create hero banner.' });
  }
});

router.put('/hero-banners/:id', upload.single('image'), async (req, res) => {
  try {
    const { title_ar, title_fr, subtitle_ar, subtitle_fr, cta_text_ar, cta_text_fr, cta_link, is_active, sort_order } = req.body;
    const u = {};
    if (title_ar !== undefined) u.title_ar = title_ar;
    if (title_fr !== undefined) u.title_fr = title_fr;
    if (subtitle_ar !== undefined) u.subtitle_ar = subtitle_ar;
    if (subtitle_fr !== undefined) u.subtitle_fr = subtitle_fr;
    if (cta_text_ar !== undefined) u.cta_text_ar = cta_text_ar;
    if (cta_text_fr !== undefined) u.cta_text_fr = cta_text_fr;
    if (cta_link !== undefined) u.cta_link = cta_link;
    if (is_active !== undefined) u.is_active = is_active !== 'false';
    if (sort_order !== undefined) u.sort_order = parseInt(sort_order) || 0;
    if (req.file) {
      const { data: old } = await supabase.from('hero_banners').select('image_url').eq('id', req.params.id).single();
      if (old?.image_url) await deleteFromSupabase(old.image_url);
      u.image_url = await uploadToSupabase(req.file, 'images', 'banners');
    }
    const { error } = await supabase.from('hero_banners').update(u).eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Hero banner updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update hero banner.' });
  }
});

router.delete('/hero-banners/:id', async (req, res) => {
  try {
    const { data } = await supabase.from('hero_banners').select('image_url').eq('id', req.params.id).single();
    if (data?.image_url) await deleteFromSupabase(data.image_url);
    const { error } = await supabase.from('hero_banners').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Hero banner deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete hero banner.' });
  }
});

// PROMO BANNERS
router.get('/promo-banners', async (req, res) => {
  try {
    const { data, error } = await supabase.from('promo_banners').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return res.json({ banners: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch promo banners.' });
  }
});

router.post('/promo-banners', upload.single('image'), async (req, res) => {
  try {
    const { title_ar, title_fr, link, is_active, sort_order } = req.body;
    let image_url = '';
    if (req.file) image_url = await uploadToSupabase(req.file, 'images', 'promos');
    const { data, error } = await supabase.from('promo_banners').insert({
      image_url, title_ar, title_fr, link, is_active: is_active !== 'false', sort_order: parseInt(sort_order) || 0,
    }).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create promo banner.' });
  }
});

router.put('/promo-banners/:id', upload.single('image'), async (req, res) => {
  try {
    const { title_ar, title_fr, link, is_active, sort_order } = req.body;
    const u = {};
    if (title_ar !== undefined) u.title_ar = title_ar;
    if (title_fr !== undefined) u.title_fr = title_fr;
    if (link !== undefined) u.link = link;
    if (is_active !== undefined) u.is_active = is_active !== 'false';
    if (sort_order !== undefined) u.sort_order = parseInt(sort_order) || 0;
    if (req.file) {
      const { data: old } = await supabase.from('promo_banners').select('image_url').eq('id', req.params.id).single();
      if (old?.image_url) await deleteFromSupabase(old.image_url);
      u.image_url = await uploadToSupabase(req.file, 'images', 'promos');
    }
    const { error } = await supabase.from('promo_banners').update(u).eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Promo banner updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update promo banner.' });
  }
});

router.delete('/promo-banners/:id', async (req, res) => {
  try {
    const { data } = await supabase.from('promo_banners').select('image_url').eq('id', req.params.id).single();
    if (data?.image_url) await deleteFromSupabase(data.image_url);
    const { error } = await supabase.from('promo_banners').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Promo banner deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete promo banner.' });
  }
});

// TESTIMONIALS
router.get('/testimonials', async (req, res) => {
  try {
    const { data, error } = await supabase.from('testimonials').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return res.json({ testimonials: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch testimonials.' });
  }
});

router.post('/testimonials', async (req, res) => {
  try {
    const { name_ar, name_fr, content_ar, content_fr, rating, is_active, sort_order } = req.body;
    const { data, error } = await supabase.from('testimonials').insert({
      name_ar, name_fr, content_ar, content_fr, rating: parseInt(rating) || 5,
      is_active: is_active !== false, sort_order: parseInt(sort_order) || 0,
    }).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create testimonial.' });
  }
});

router.put('/testimonials/:id', async (req, res) => {
  try {
    const { name_ar, name_fr, content_ar, content_fr, rating, is_active, sort_order } = req.body;
    const u = {};
    if (name_ar !== undefined) u.name_ar = name_ar;
    if (name_fr !== undefined) u.name_fr = name_fr;
    if (content_ar !== undefined) u.content_ar = content_ar;
    if (content_fr !== undefined) u.content_fr = content_fr;
    if (rating !== undefined) u.rating = parseInt(rating);
    if (is_active !== undefined) u.is_active = is_active;
    if (sort_order !== undefined) u.sort_order = parseInt(sort_order);
    const { error } = await supabase.from('testimonials').update(u).eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Testimonial updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update testimonial.' });
  }
});

router.delete('/testimonials/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('testimonials').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Testimonial deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete testimonial.' });
  }
});

// SETTINGS
router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
    if (error) throw error;
    return res.json({ settings: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

router.put('/settings', upload.single('logo'), async (req, res) => {
  try {
    const { store_name, whatsapp_number, phone_number, email, address_ar, address_fr, facebook_url, instagram_url, tiktok_url } = req.body;
    const { data: existing } = await supabase.from('store_settings').select('id, logo_url').limit(1).single();
    if (!existing) return res.status(404).json({ error: 'Settings not found.' });
    const u = {};
    if (store_name !== undefined) u.store_name = store_name;
    if (whatsapp_number !== undefined) u.whatsapp_number = whatsapp_number;
    if (phone_number !== undefined) u.phone_number = phone_number;
    if (email !== undefined) u.email = email;
    if (address_ar !== undefined) u.address_ar = address_ar;
    if (address_fr !== undefined) u.address_fr = address_fr;
    if (facebook_url !== undefined) u.facebook_url = facebook_url;
    if (instagram_url !== undefined) u.instagram_url = instagram_url;
    if (tiktok_url !== undefined) u.tiktok_url = tiktok_url;
    if (req.file) {
      if (existing.logo_url) await deleteFromSupabase(existing.logo_url);
      u.logo_url = await uploadToSupabase(req.file, 'images', 'settings');
    }
    const { error } = await supabase.from('store_settings').update(u).eq('id', existing.id);
    if (error) throw error;
    return res.json({ message: 'Settings updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update settings.' });
  }
});

module.exports = router;
