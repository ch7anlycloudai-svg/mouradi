const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/database');

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
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clauses
    const conditions = ['p.is_available = true'];
    const params = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`p.category_id = $${paramIdx++}`);
      params.push(category);
    }
    if (minPrice) {
      conditions.push(`p.price >= $${paramIdx++}`);
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push(`p.price <= $${paramIdx++}`);
      params.push(parseFloat(maxPrice));
    }
    if (search) {
      conditions.push(`(p.name_ar ILIKE $${paramIdx} OR p.name_fr ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    // Sorting
    let orderBy = 'p.created_at DESC';
    switch (sort) {
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'featured':
        conditions.push('p.is_featured = true');
        orderBy = 'p.created_at DESC';
        break;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) FROM products p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Fetch products
    const productsResult = await query(
      `SELECT p.*,
              json_build_object('id', c.id, 'name_ar', c.name_ar, 'name_fr', c.name_fr) AS category
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limitNum, offset]
    );

    // Fetch related data for all products
    const products = productsResult.rows;
    if (products.length > 0) {
      const productIds = products.map((p) => p.id);

      const [imagesResult, colorsResult, sizesResult] = await Promise.all([
        query('SELECT * FROM product_images WHERE product_id = ANY($1) ORDER BY sort_order', [productIds]),
        query('SELECT * FROM product_colors WHERE product_id = ANY($1)', [productIds]),
        query('SELECT * FROM product_sizes WHERE product_id = ANY($1)', [productIds]),
      ]);

      const imagesMap = {};
      const colorsMap = {};
      const sizesMap = {};

      for (const img of imagesResult.rows) {
        if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
        imagesMap[img.product_id].push(img);
      }
      for (const clr of colorsResult.rows) {
        if (!colorsMap[clr.product_id]) colorsMap[clr.product_id] = [];
        colorsMap[clr.product_id].push(clr);
      }
      for (const sz of sizesResult.rows) {
        if (!sizesMap[sz.product_id]) sizesMap[sz.product_id] = [];
        sizesMap[sz.product_id].push(sz);
      }

      for (const p of products) {
        p.images = imagesMap[p.id] || [];
        p.colors = colorsMap[p.id] || [];
        p.sizes = sizesMap[p.id] || [];
        // Normalize category null
        if (!p.category || !p.category.id) p.category = null;
      }
    }

    // Post-filter by size / color (related tables)
    let filtered = products;
    if (size) {
      filtered = filtered.filter((p) =>
        p.sizes?.some((s) => s.size.toLowerCase() === size.toLowerCase())
      );
    }
    if (color) {
      filtered = filtered.filter((p) =>
        p.colors?.some((c) =>
          c.name_ar.toLowerCase().includes(color.toLowerCase()) ||
          c.name_fr.toLowerCase().includes(color.toLowerCase()) ||
          c.hex_code.toLowerCase() === color.toLowerCase()
        )
      );
    }

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

    const productResult = await query(
      `SELECT p.*,
              json_build_object('id', c.id, 'name_ar', c.name_ar, 'name_fr', c.name_fr) AS category
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = productResult.rows[0];

    const [imagesResult, colorsResult, sizesResult] = await Promise.all([
      query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order', [id]),
      query('SELECT * FROM product_colors WHERE product_id = $1', [id]),
      query('SELECT * FROM product_sizes WHERE product_id = $1', [id]),
    ]);

    product.images = imagesResult.rows;
    product.colors = colorsResult.rows;
    product.sizes = sizesResult.rows;
    if (!product.category || !product.category.id) product.category = null;

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
    const result = await query('SELECT * FROM categories ORDER BY sort_order ASC');
    return res.json(result.rows);
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
      categoriesRes,
      testimonialsRes,
    ] = await Promise.all([
      query("SELECT * FROM hero_banners WHERE is_active = true ORDER BY sort_order ASC"),
      query("SELECT * FROM promo_banners WHERE is_active = true ORDER BY sort_order ASC"),
      query("SELECT * FROM categories ORDER BY sort_order ASC"),
      query("SELECT * FROM testimonials WHERE is_active = true ORDER BY sort_order ASC"),
    ]);

    // Fetch featured, new arrivals, sale products
    const [featuredRes, newArrivalsRes, saleRes] = await Promise.all([
      query(
        `SELECT p.*, json_build_object('id', c.id, 'name_ar', c.name_ar, 'name_fr', c.name_fr) AS category
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_available = true AND p.is_featured = true
         ORDER BY p.created_at DESC LIMIT 8`
      ),
      query(
        `SELECT p.*, json_build_object('id', c.id, 'name_ar', c.name_ar, 'name_fr', c.name_fr) AS category
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_available = true AND p.is_new_arrival = true
         ORDER BY p.created_at DESC LIMIT 8`
      ),
      query(
        `SELECT p.*, json_build_object('id', c.id, 'name_ar', c.name_ar, 'name_fr', c.name_fr) AS category
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_available = true AND p.is_on_sale = true
         ORDER BY p.created_at DESC LIMIT 8`
      ),
    ]);

    // Gather all product IDs to fetch images/colors/sizes in bulk
    const allProducts = [...featuredRes.rows, ...newArrivalsRes.rows, ...saleRes.rows];
    const allProductIds = [...new Set(allProducts.map((p) => p.id))];

    let imagesMap = {};
    let colorsMap = {};
    let sizesMap = {};

    if (allProductIds.length > 0) {
      const [imagesResult, colorsResult, sizesResult] = await Promise.all([
        query('SELECT * FROM product_images WHERE product_id = ANY($1) ORDER BY sort_order', [allProductIds]),
        query('SELECT * FROM product_colors WHERE product_id = ANY($1)', [allProductIds]),
        query('SELECT * FROM product_sizes WHERE product_id = ANY($1)', [allProductIds]),
      ]);

      for (const img of imagesResult.rows) {
        if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
        imagesMap[img.product_id].push(img);
      }
      for (const clr of colorsResult.rows) {
        if (!colorsMap[clr.product_id]) colorsMap[clr.product_id] = [];
        colorsMap[clr.product_id].push(clr);
      }
      for (const sz of sizesResult.rows) {
        if (!sizesMap[sz.product_id]) sizesMap[sz.product_id] = [];
        sizesMap[sz.product_id].push(sz);
      }
    }

    const normalizeProducts = (rows) =>
      rows.map((p) => ({
        ...p,
        images: imagesMap[p.id] || [],
        colors: colorsMap[p.id] || [],
        sizes: sizesMap[p.id] || [],
        category: p.category && p.category.id ? p.category : null,
      }));

    return res.json({
      heroBanners: heroBannersRes.rows,
      promoBanners: promoBannersRes.rows,
      featuredProducts: normalizeProducts(featuredRes.rows),
      newArrivals: normalizeProducts(newArrivalsRes.rows),
      saleProducts: normalizeProducts(saleRes.rows),
      testimonials: testimonialsRes.rows,
      categories: categoriesRes.rows,
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
    const result = await query('SELECT * FROM store_settings LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching settings:', err);
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/orders - Create order (guest checkout)
// ---------------------------------------------------------------------------
router.post('/orders', async (req, res) => {
  const client = await getClient();
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

    await client.query('BEGIN');

    // 1. Find or create customer by phone
    let customerResult = await client.query(
      'SELECT * FROM customers WHERE phone = $1',
      [customer_phone]
    );
    let customer = customerResult.rows[0];

    if (!customer) {
      const insertResult = await client.query(
        'INSERT INTO customers (name, phone, province, address) VALUES ($1, $2, $3, $4) RETURNING *',
        [customer_name, customer_phone, customer_province, customer_address]
      );
      customer = insertResult.rows[0];
    }

    // 2. Fetch product details for price validation
    const productIds = items.map((i) => i.product_id);
    const productsResult = await client.query(
      'SELECT id, name_ar, name_fr, price FROM products WHERE id = ANY($1)',
      [productIds]
    );

    const productMap = {};
    for (const p of productsResult.rows) {
      productMap[p.id] = p;
    }

    for (const item of items) {
      if (!productMap[item.product_id]) {
        await client.query('ROLLBACK');
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
      const couponResult = await client.query(
        "SELECT * FROM coupons WHERE code = $1 AND is_active = true",
        [coupon_code.toUpperCase()]
      );
      const coupon = couponResult.rows[0];

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
          await client.query(
            'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
            [coupon.id]
          );
        }
      }
    }

    const total = Math.round((subtotal - discountAmount) * 100) / 100;

    // 5. Generate order number WW-YYYY-NNNN
    const year = new Date().getFullYear();
    const lastOrderResult = await client.query(
      "SELECT order_number FROM orders WHERE order_number LIKE $1 ORDER BY created_at DESC LIMIT 1",
      [`WW-${year}-%`]
    );

    let nextNum = 1;
    if (lastOrderResult.rows.length > 0) {
      const parts = lastOrderResult.rows[0].order_number.split('-');
      const lastNum = parseInt(parts[2], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const orderNumber = `WW-${year}-${String(nextNum).padStart(4, '0')}`;

    // 6. Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_id, customer_name, customer_phone, customer_province, customer_address, customer_notes, subtotal, discount_amount, total, coupon_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
       RETURNING *`,
      [orderNumber, customer.id, customer_name, customer_phone, customer_province, customer_address, customer_notes || null, subtotal, discountAmount, total, coupon_code ? coupon_code.toUpperCase() : null]
    );
    const order = orderResult.rows[0];

    // 7. Insert order items
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name_ar, product_name_fr, product_image, price, quantity, color_name_ar, color_name_fr, color_hex, size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [order.id, item.product_id, item.product_name_ar, item.product_name_fr, item.product_image, item.price, item.quantity, item.color_name_ar, item.color_name_fr, item.color_hex, item.size]
      );
    }

    await client.query('COMMIT');

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
    await client.query('ROLLBACK');
    console.error('Error creating order:', err);
    return res.status(500).json({ error: 'Failed to create order.' });
  } finally {
    client.release();
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

    const result = await query(
      "SELECT * FROM coupons WHERE code = $1 AND is_active = true",
      [code.toUpperCase()]
    );

    const coupon = result.rows[0];
    if (!coupon) {
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
