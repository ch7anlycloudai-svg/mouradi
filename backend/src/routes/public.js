const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// ---------------------------------------------------------------------------
// GET /api/products - List products with filters, pagination, sorting
// ---------------------------------------------------------------------------
router.get('/products', async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      size,
      color,
      search,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from('products')
      .select(
        '*, product_images(*), product_colors(*), product_sizes(*), category:categories(id, name_ar, name_fr)',
        { count: 'exact' }
      )
      .eq('is_available', true);

    // Filter by category
    if (category) {
      query = query.eq('category_id', category);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (search) {
      query = query.or(`name_ar.ilike.%${search}%,name_fr.ilike.%${search}%`);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'featured':
        query = query.eq('is_featured', true).order('created_at', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) throw error;

    // Post-filter by size / color (related tables)
    let filtered = products || [];
    if (size) {
      filtered = filtered.filter((p) =>
        p.product_sizes?.some((s) => s.size.toLowerCase() === size.toLowerCase())
      );
    }
    if (color) {
      filtered = filtered.filter((p) =>
        p.product_colors?.some((c) =>
          c.name_ar.toLowerCase().includes(color.toLowerCase()) ||
          c.name_fr.toLowerCase().includes(color.toLowerCase()) ||
          c.hex_code.toLowerCase() === color.toLowerCase()
        )
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      products: filtered,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/products/:id - Single product with all relations
// ---------------------------------------------------------------------------
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select(
        '*, product_images(*), product_colors(*), product_sizes(*), category:categories(id, name_ar, name_fr)'
      )
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Sort images by sort_order
    if (product.product_images) {
      product.images = product.product_images.sort((a, b) => a.sort_order - b.sort_order);
      delete product.product_images;
    }
    if (product.product_colors) {
      product.colors = product.product_colors;
      delete product.product_colors;
    }
    if (product.product_sizes) {
      product.sizes = product.product_sizes;
      delete product.product_sizes;
    }

    return res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    return res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/categories - All categories ordered by sort_order
// ---------------------------------------------------------------------------
router.get('/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return res.json(categories || []);
  } catch (err) {
    console.error('Error fetching categories:', err);
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/homepage - Homepage data aggregate
// ---------------------------------------------------------------------------
router.get('/homepage', async (req, res) => {
  try {
    const [
      heroBannersRes,
      promoBannersRes,
      featuredRes,
      newArrivalsRes,
      saleRes,
      testimonialsRes,
      categoriesRes,
    ] = await Promise.all([
      supabase
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('promo_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('products')
        .select('*, product_images(*), product_colors(*), product_sizes(*), category:categories(id, name_ar, name_fr)')
        .eq('is_available', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('products')
        .select('*, product_images(*), product_colors(*), product_sizes(*), category:categories(id, name_ar, name_fr)')
        .eq('is_available', true)
        .eq('is_new_arrival', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('products')
        .select('*, product_images(*), product_colors(*), product_sizes(*), category:categories(id, name_ar, name_fr)')
        .eq('is_available', true)
        .eq('is_on_sale', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true }),
    ]);

    // Normalize product data
    const normalizeProducts = (products) => {
      return (products || []).map(p => ({
        ...p,
        images: (p.product_images || []).sort((a, b) => a.sort_order - b.sort_order),
        colors: p.product_colors || [],
        sizes: p.product_sizes || [],
        product_images: undefined,
        product_colors: undefined,
        product_sizes: undefined,
      }));
    };

    return res.json({
      heroBanners: heroBannersRes.data || [],
      promoBanners: promoBannersRes.data || [],
      featuredProducts: normalizeProducts(featuredRes.data),
      newArrivals: normalizeProducts(newArrivalsRes.data),
      saleProducts: normalizeProducts(saleRes.data),
      testimonials: testimonialsRes.data || [],
      categories: categoriesRes.data || [],
    });
  } catch (err) {
    console.error('Error fetching homepage data:', err);
    return res.status(500).json({ error: 'Failed to fetch homepage data.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/settings - Store settings
// ---------------------------------------------------------------------------
router.get('/settings', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;

    return res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/orders - Create order (guest checkout)
// ---------------------------------------------------------------------------
router.post('/orders', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_province,
      customer_address,
      customer_notes,
      items,
      coupon_code,
    } = req.body;

    // Validate required fields
    if (!customer_name || !customer_phone || !customer_province || !customer_address) {
      return res.status(400).json({ error: 'Missing required customer information.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    // 1. Find or create customer by phone
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', customer_phone)
      .single();

    if (!customer) {
      const { data: newCustomer, error: custErr } = await supabase
        .from('customers')
        .insert({
          name: customer_name,
          phone: customer_phone,
          province: customer_province,
          address: customer_address,
        })
        .select()
        .single();

      if (custErr) throw custErr;
      customer = newCustomer;
    }

    // 2. Fetch product details for price validation
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name_ar, name_fr, price')
      .in('id', productIds);

    if (prodErr) throw prodErr;

    const productMap = {};
    (products || []).forEach((p) => { productMap[p.id] = p; });

    for (const item of items) {
      if (!productMap[item.product_id]) {
        return res.status(400).json({ error: `Product ${item.product_id} not found.` });
      }
    }

    // 3. Build order items and calculate subtotal
    let subtotal = 0;
    const orderItems = items.map((item) => {
      const product = productMap[item.product_id];
      const unitPrice = parseFloat(product.price);
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      return {
        product_id: item.product_id,
        product_name_ar: product.name_ar,
        product_name_fr: product.name_fr,
        product_image: item.product_image || null,
        price: unitPrice,
        quantity,
        color_name_ar: item.color_name_ar || null,
        color_name_fr: item.color_name_fr || null,
        color_hex: item.color_hex || null,
        size: item.size || null,
      };
    });

    // 4. Apply coupon if provided
    let discountAmount = 0;

    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupon) {
        const now = new Date();
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > now;
        const notExceeded = !coupon.max_uses || coupon.used_count < coupon.max_uses;
        const meetsMin = !coupon.min_order_amount || subtotal >= parseFloat(coupon.min_order_amount);

        if (notExpired && notExceeded && meetsMin) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
          } else {
            discountAmount = parseFloat(coupon.discount_value);
          }
          discountAmount = Math.min(discountAmount, subtotal);
          discountAmount = Math.round(discountAmount * 100) / 100;

          // Increment used_count
          await supabase
            .from('coupons')
            .update({ used_count: coupon.used_count + 1 })
            .eq('id', coupon.id);
        }
      }
    }

    const total = Math.round((subtotal - discountAmount) * 100) / 100;

    // 5. Generate order number WW-YYYY-NNNN
    const year = new Date().getFullYear();
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('order_number')
      .like('order_number', `WW-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let nextNum = 1;
    if (lastOrder && lastOrder.order_number) {
      const parts = lastOrder.order_number.split('-');
      const lastNum = parseInt(parts[2], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const orderNumber = `WW-${year}-${String(nextNum).padStart(4, '0')}`;

    // 6. Insert order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        customer_name,
        customer_phone,
        customer_province,
        customer_address,
        customer_notes: customer_notes || null,
        subtotal,
        discount_amount: discountAmount,
        total,
        coupon_code: coupon_code ? coupon_code.toUpperCase() : null,
        status: 'pending',
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 7. Insert order items
    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsErr) throw itemsErr;

    return res.status(201).json({
      message: 'Order placed successfully.',
      order: {
        id: order.id,
        order_number: order.order_number,
        total: order.total,
        status: order.status,
      },
    });
  } catch (err) {
    console.error('Error creating order:', err);
    return res.status(500).json({ error: 'Failed to create order.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/coupons/validate - Validate a coupon code
// ---------------------------------------------------------------------------
router.post('/coupons/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required.' });
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return res.status(404).json({ error: 'Coupon not found or inactive.' });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'expired' });
    }

    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ error: 'Coupon has reached maximum uses.' });
    }

    const amount = parseFloat(subtotal) || 0;
    if (coupon.min_order_amount && amount < parseFloat(coupon.min_order_amount)) {
      return res.status(400).json({
        error: `Minimum order amount of ${coupon.min_order_amount} is required.`,
      });
    }

    let discount_amount = 0;
    if (amount > 0) {
      if (coupon.discount_type === 'percentage') {
        discount_amount = (amount * parseFloat(coupon.discount_value)) / 100;
      } else {
        discount_amount = parseFloat(coupon.discount_value);
      }
      discount_amount = Math.min(discount_amount, amount);
      discount_amount = Math.round(discount_amount * 100) / 100;
    }

    return res.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.discount_value),
      discount_amount,
    });
  } catch (err) {
    console.error('Error validating coupon:', err);
    return res.status(500).json({ error: 'Failed to validate coupon.' });
  }
});

module.exports = router;
