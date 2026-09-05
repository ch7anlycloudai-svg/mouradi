const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { isAdmin } = require('../middleware/auth');
const { upload, getFileUrl, deleteFile, setUploadFolder } = require('../middleware/upload');

router.use(isAdmin);

// ======================= DASHBOARD =======================

router.get('/dashboard', async (req, res) => {
  try {
    const [ordersRes, productsRes, customersRes, revenueRes, recentRes] = await Promise.all([
      query('SELECT COUNT(*) FROM orders'),
      query('SELECT COUNT(*) FROM products'),
      query('SELECT COUNT(*) FROM customers'),
      query('SELECT COALESCE(SUM(total), 0) AS total_revenue FROM orders'),
      query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10'),
    ]);

    return res.json({
      totalOrders: parseInt(ordersRes.rows[0].count, 10),
      totalProducts: parseInt(productsRes.rows[0].count, 10),
      totalCustomers: parseInt(customersRes.rows[0].count, 10),
      totalRevenue: parseFloat(revenueRes.rows[0].total_revenue),
      recentOrders: recentRes.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

// ======================= PRODUCTS =======================

router.get('/products', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(p.name_ar ILIKE $${paramIdx} OR p.name_fr ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (category) {
      conditions.push(`p.category_id = $${paramIdx++}`);
      params.push(category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM products p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const productsResult = await query(
      `SELECT p.*,
              json_build_object('id', c.id, 'name_ar', c.name_ar, 'name_fr', c.name_fr) AS category
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limitNum, offset]
    );

    const products = productsResult.rows;
    if (products.length > 0) {
      const productIds = products.map((p) => p.id);
      const [imagesResult, colorsResult, sizesResult] = await Promise.all([
        query('SELECT * FROM product_images WHERE product_id = ANY($1) ORDER BY sort_order', [productIds]),
        query('SELECT * FROM product_colors WHERE product_id = ANY($1)', [productIds]),
        query('SELECT * FROM product_sizes WHERE product_id = ANY($1)', [productIds]),
      ]);

      const imagesMap = {}, colorsMap = {}, sizesMap = {};
      for (const img of imagesResult.rows) { if (!imagesMap[img.product_id]) imagesMap[img.product_id] = []; imagesMap[img.product_id].push(img); }
      for (const clr of colorsResult.rows) { if (!colorsMap[clr.product_id]) colorsMap[clr.product_id] = []; colorsMap[clr.product_id].push(clr); }
      for (const sz of sizesResult.rows) { if (!sizesMap[sz.product_id]) sizesMap[sz.product_id] = []; sizesMap[sz.product_id].push(sz); }

      for (const p of products) {
        p.images = imagesMap[p.id] || [];
        p.colors = colorsMap[p.id] || [];
        p.sizes = sizesMap[p.id] || [];
        if (!p.category || !p.category.id) p.category = null;
      }
    }

    return res.json({
      products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('Admin products error:', err);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const productResult = await query(
      `SELECT p.*,
              json_build_object('id', c.id, 'name_ar', c.name_ar, 'name_fr', c.name_fr) AS category
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (productResult.rows.length === 0) return res.status(404).json({ error: 'Product not found.' });

    const product = productResult.rows[0];
    const [imagesResult, colorsResult, sizesResult] = await Promise.all([
      query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order', [product.id]),
      query('SELECT * FROM product_colors WHERE product_id = $1', [product.id]),
      query('SELECT * FROM product_sizes WHERE product_id = $1', [product.id]),
    ]);
    product.images = imagesResult.rows;
    product.colors = colorsResult.rows;
    product.sizes = sizesResult.rows;
    if (!product.category || !product.category.id) product.category = null;

    return res.json(product);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

router.post('/products', setUploadFolder('products'), upload.array('images', 10), async (req, res) => {
  try {
    const { name_ar, name_fr, description_ar, description_fr, price, old_price, category_id, is_available, is_featured, is_new_arrival, is_on_sale, colors, sizes } = req.body;

    const productResult = await query(
      `INSERT INTO products (name_ar, name_fr, description_ar, description_fr, price, old_price, category_id, is_available, is_featured, is_new_arrival, is_on_sale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [name_ar, name_fr, description_ar || '', description_fr || '', parseFloat(price), old_price ? parseFloat(old_price) : null, category_id || null, is_available !== 'false', is_featured === 'true', is_new_arrival === 'true', is_on_sale === 'true']
    );
    const product = productResult.rows[0];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const url = getFileUrl(req.files[i]);
        await query(
          'INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES ($1, $2, $3, $4)',
          [product.id, url, i, i === 0]
        );
      }
    }

    if (colors) {
      const arr = typeof colors === 'string' ? JSON.parse(colors) : colors;
      if (Array.isArray(arr) && arr.length > 0) {
        for (const c of arr) {
          await query(
            'INSERT INTO product_colors (product_id, name_ar, name_fr, hex_code) VALUES ($1, $2, $3, $4)',
            [product.id, c.name_ar || '', c.name_fr || '', c.hex_code || '#000000']
          );
        }
      }
    }

    if (sizes) {
      const arr = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      if (Array.isArray(arr) && arr.length > 0) {
        for (const s of arr) {
          await query(
            'INSERT INTO product_sizes (product_id, size) VALUES ($1, $2)',
            [product.id, typeof s === 'string' ? s : s.size]
          );
        }
      }
    }

    return res.status(201).json({ message: 'Product created.', product });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ error: 'Failed to create product.' });
  }
});

router.put('/products/:id', setUploadFolder('products'), upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { name_ar, name_fr, description_ar, description_fr, price, old_price, category_id, is_available, is_featured, is_new_arrival, is_on_sale, colors, sizes } = req.body;

    const setClauses = [];
    const params = [];
    let paramIdx = 1;

    if (name_ar !== undefined) { setClauses.push(`name_ar = $${paramIdx++}`); params.push(name_ar); }
    if (name_fr !== undefined) { setClauses.push(`name_fr = $${paramIdx++}`); params.push(name_fr); }
    if (description_ar !== undefined) { setClauses.push(`description_ar = $${paramIdx++}`); params.push(description_ar); }
    if (description_fr !== undefined) { setClauses.push(`description_fr = $${paramIdx++}`); params.push(description_fr); }
    if (price !== undefined) { setClauses.push(`price = $${paramIdx++}`); params.push(parseFloat(price)); }
    if (old_price !== undefined) { setClauses.push(`old_price = $${paramIdx++}`); params.push(old_price ? parseFloat(old_price) : null); }
    if (category_id !== undefined) { setClauses.push(`category_id = $${paramIdx++}`); params.push(category_id || null); }
    if (is_available !== undefined) { setClauses.push(`is_available = $${paramIdx++}`); params.push(is_available !== 'false'); }
    if (is_featured !== undefined) { setClauses.push(`is_featured = $${paramIdx++}`); params.push(is_featured === 'true'); }
    if (is_new_arrival !== undefined) { setClauses.push(`is_new_arrival = $${paramIdx++}`); params.push(is_new_arrival === 'true'); }
    if (is_on_sale !== undefined) { setClauses.push(`is_on_sale = $${paramIdx++}`); params.push(is_on_sale === 'true'); }

    if (setClauses.length > 0) {
      params.push(id);
      await query(`UPDATE products SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`, params);
    }

    if (req.files && req.files.length > 0) {
      const maxSortResult = await query(
        'SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM product_images WHERE product_id = $1',
        [id]
      );
      let so = parseInt(maxSortResult.rows[0].max_sort, 10) + 1;

      for (let i = 0; i < req.files.length; i++) {
        const url = getFileUrl(req.files[i]);
        await query(
          'INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES ($1, $2, $3, false)',
          [id, url, so + i]
        );
      }
    }

    if (colors !== undefined) {
      // Delete old colors and their files
      await query('DELETE FROM product_colors WHERE product_id = $1', [id]);
      const arr = typeof colors === 'string' ? JSON.parse(colors) : colors;
      if (Array.isArray(arr) && arr.length > 0) {
        for (const c of arr) {
          await query(
            'INSERT INTO product_colors (product_id, name_ar, name_fr, hex_code) VALUES ($1, $2, $3, $4)',
            [id, c.name_ar || '', c.name_fr || '', c.hex_code || '#000000']
          );
        }
      }
    }

    if (sizes !== undefined) {
      await query('DELETE FROM product_sizes WHERE product_id = $1', [id]);
      const arr = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      if (Array.isArray(arr) && arr.length > 0) {
        for (const s of arr) {
          await query(
            'INSERT INTO product_sizes (product_id, size) VALUES ($1, $2)',
            [id, typeof s === 'string' ? s : s.size]
          );
        }
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
    // Delete associated image files
    const imagesResult = await query('SELECT image_url FROM product_images WHERE product_id = $1', [req.params.id]);
    for (const img of imagesResult.rows) deleteFile(img.image_url);

    await query('DELETE FROM products WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Product deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
});

router.delete('/product-images/:id', async (req, res) => {
  try {
    const imgResult = await query('SELECT image_url FROM product_images WHERE id = $1', [req.params.id]);
    if (imgResult.rows.length > 0) deleteFile(imgResult.rows[0].image_url);
    await query('DELETE FROM product_images WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Image deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete image.' });
  }
});

// ======================= CATEGORIES =======================

router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY sort_order ASC');
    return res.json({ categories: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

router.post('/categories', setUploadFolder('categories'), upload.single('image'), async (req, res) => {
  try {
    const { name_ar, name_fr, sort_order } = req.body;
    let image_url = null;
    if (req.file) image_url = getFileUrl(req.file);
    const result = await query(
      'INSERT INTO categories (name_ar, name_fr, image_url, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [name_ar, name_fr, image_url, parseInt(sort_order) || 0]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create category.' });
  }
});

router.put('/categories/:id', setUploadFolder('categories'), upload.single('image'), async (req, res) => {
  try {
    const { name_ar, name_fr, sort_order } = req.body;
    const setClauses = [];
    const params = [];
    let paramIdx = 1;

    if (name_ar !== undefined) { setClauses.push(`name_ar = $${paramIdx++}`); params.push(name_ar); }
    if (name_fr !== undefined) { setClauses.push(`name_fr = $${paramIdx++}`); params.push(name_fr); }
    if (sort_order !== undefined) { setClauses.push(`sort_order = $${paramIdx++}`); params.push(parseInt(sort_order) || 0); }

    if (req.file) {
      const oldResult = await query('SELECT image_url FROM categories WHERE id = $1', [req.params.id]);
      if (oldResult.rows[0]?.image_url) deleteFile(oldResult.rows[0].image_url);
      setClauses.push(`image_url = $${paramIdx++}`);
      params.push(getFileUrl(req.file));
    }

    if (setClauses.length > 0) {
      params.push(req.params.id);
      await query(`UPDATE categories SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`, params);
    }
    return res.json({ message: 'Category updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update category.' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const result = await query('SELECT image_url FROM categories WHERE id = $1', [req.params.id]);
    if (result.rows[0]?.image_url) deleteFile(result.rows[0].image_url);
    await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Category deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// ======================= ORDERS =======================

router.get('/orders', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(order_number ILIKE $${paramIdx} OR customer_phone ILIKE $${paramIdx} OR customer_name ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) FROM orders ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const ordersResult = await query(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limitNum, offset]
    );

    return res.json({
      orders: ordersResult.rows,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found.' });
    const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    return res.json({ order: { ...orderResult.rows[0], items: itemsResult.rows } });
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
    await query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
    return res.json({ message: 'Order status updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// ======================= CUSTOMERS =======================

router.get('/customers', async (req, res) => {
  try {
    const { search } = req.query;
    let customersQuery = 'SELECT * FROM customers';
    const params = [];

    if (search) {
      customersQuery += ' WHERE name ILIKE $1 OR phone ILIKE $1';
      params.push(`%${search}%`);
    }
    customersQuery += ' ORDER BY created_at DESC';

    const customersResult = await query(customersQuery, params);

    // Enrich with order stats
    const enriched = await Promise.all(
      customersResult.rows.map(async (c) => {
        const ordersResult = await query('SELECT total FROM orders WHERE customer_id = $1', [c.id]);
        return {
          ...c,
          total_orders: ordersResult.rows.length,
          total_spent: ordersResult.rows.reduce((s, o) => s + (parseFloat(o.total) || 0), 0),
        };
      })
    );

    return res.json({ customers: enriched });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch customers.' });
  }
});

// ======================= COUPONS =======================

router.get('/coupons', async (req, res) => {
  try {
    const result = await query('SELECT * FROM coupons ORDER BY created_at DESC');
    return res.json({ coupons: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch coupons.' });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_uses, is_active, expires_at } = req.body;
    const result = await query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, is_active, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code.toUpperCase(), discount_type, parseFloat(discount_value), min_order_amount ? parseFloat(min_order_amount) : null, max_uses ? parseInt(max_uses) : null, is_active !== false, expires_at || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create coupon.' });
  }
});

router.put('/coupons/:id', async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_uses, is_active, expires_at } = req.body;
    const setClauses = [];
    const params = [];
    let paramIdx = 1;

    if (code !== undefined) { setClauses.push(`code = $${paramIdx++}`); params.push(code.toUpperCase()); }
    if (discount_type !== undefined) { setClauses.push(`discount_type = $${paramIdx++}`); params.push(discount_type); }
    if (discount_value !== undefined) { setClauses.push(`discount_value = $${paramIdx++}`); params.push(parseFloat(discount_value)); }
    if (min_order_amount !== undefined) { setClauses.push(`min_order_amount = $${paramIdx++}`); params.push(min_order_amount ? parseFloat(min_order_amount) : null); }
    if (max_uses !== undefined) { setClauses.push(`max_uses = $${paramIdx++}`); params.push(max_uses ? parseInt(max_uses) : null); }
    if (is_active !== undefined) { setClauses.push(`is_active = $${paramIdx++}`); params.push(is_active); }
    if (expires_at !== undefined) { setClauses.push(`expires_at = $${paramIdx++}`); params.push(expires_at || null); }

    if (setClauses.length > 0) {
      params.push(req.params.id);
      await query(`UPDATE coupons SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`, params);
    }
    return res.json({ message: 'Coupon updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update coupon.' });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    await query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Coupon deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete coupon.' });
  }
});

// ======================= HERO BANNERS =======================

router.get('/hero-banners', async (req, res) => {
  try {
    const result = await query('SELECT * FROM hero_banners ORDER BY sort_order ASC');
    return res.json({ banners: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch hero banners.' });
  }
});

router.post('/hero-banners', setUploadFolder('banners'), upload.single('image'), async (req, res) => {
  try {
    const { title_ar, title_fr, subtitle_ar, subtitle_fr, cta_text_ar, cta_text_fr, cta_link, is_active, sort_order } = req.body;
    let image_url = '';
    if (req.file) image_url = getFileUrl(req.file);
    const result = await query(
      `INSERT INTO hero_banners (image_url, title_ar, title_fr, subtitle_ar, subtitle_fr, cta_text_ar, cta_text_fr, cta_link, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [image_url, title_ar, title_fr, subtitle_ar, subtitle_fr, cta_text_ar, cta_text_fr, cta_link, is_active !== 'false', parseInt(sort_order) || 0]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create hero banner.' });
  }
});

router.put('/hero-banners/:id', setUploadFolder('banners'), upload.single('image'), async (req, res) => {
  try {
    const { title_ar, title_fr, subtitle_ar, subtitle_fr, cta_text_ar, cta_text_fr, cta_link, is_active, sort_order } = req.body;
    const setClauses = [];
    const params = [];
    let paramIdx = 1;

    if (title_ar !== undefined) { setClauses.push(`title_ar = $${paramIdx++}`); params.push(title_ar); }
    if (title_fr !== undefined) { setClauses.push(`title_fr = $${paramIdx++}`); params.push(title_fr); }
    if (subtitle_ar !== undefined) { setClauses.push(`subtitle_ar = $${paramIdx++}`); params.push(subtitle_ar); }
    if (subtitle_fr !== undefined) { setClauses.push(`subtitle_fr = $${paramIdx++}`); params.push(subtitle_fr); }
    if (cta_text_ar !== undefined) { setClauses.push(`cta_text_ar = $${paramIdx++}`); params.push(cta_text_ar); }
    if (cta_text_fr !== undefined) { setClauses.push(`cta_text_fr = $${paramIdx++}`); params.push(cta_text_fr); }
    if (cta_link !== undefined) { setClauses.push(`cta_link = $${paramIdx++}`); params.push(cta_link); }
    if (is_active !== undefined) { setClauses.push(`is_active = $${paramIdx++}`); params.push(is_active !== 'false'); }
    if (sort_order !== undefined) { setClauses.push(`sort_order = $${paramIdx++}`); params.push(parseInt(sort_order) || 0); }

    if (req.file) {
      const oldResult = await query('SELECT image_url FROM hero_banners WHERE id = $1', [req.params.id]);
      if (oldResult.rows[0]?.image_url) deleteFile(oldResult.rows[0].image_url);
      setClauses.push(`image_url = $${paramIdx++}`);
      params.push(getFileUrl(req.file));
    }

    if (setClauses.length > 0) {
      params.push(req.params.id);
      await query(`UPDATE hero_banners SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`, params);
    }
    return res.json({ message: 'Hero banner updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update hero banner.' });
  }
});

router.delete('/hero-banners/:id', async (req, res) => {
  try {
    const result = await query('SELECT image_url FROM hero_banners WHERE id = $1', [req.params.id]);
    if (result.rows[0]?.image_url) deleteFile(result.rows[0].image_url);
    await query('DELETE FROM hero_banners WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Hero banner deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete hero banner.' });
  }
});

// ======================= PROMO BANNERS =======================

router.get('/promo-banners', async (req, res) => {
  try {
    const result = await query('SELECT * FROM promo_banners ORDER BY sort_order ASC');
    return res.json({ banners: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch promo banners.' });
  }
});

router.post('/promo-banners', setUploadFolder('promos'), upload.single('image'), async (req, res) => {
  try {
    const { title_ar, title_fr, link, is_active, sort_order } = req.body;
    let image_url = '';
    if (req.file) image_url = getFileUrl(req.file);
    const result = await query(
      `INSERT INTO promo_banners (image_url, title_ar, title_fr, link, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [image_url, title_ar, title_fr, link, is_active !== 'false', parseInt(sort_order) || 0]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create promo banner.' });
  }
});

router.put('/promo-banners/:id', setUploadFolder('promos'), upload.single('image'), async (req, res) => {
  try {
    const { title_ar, title_fr, link, is_active, sort_order } = req.body;
    const setClauses = [];
    const params = [];
    let paramIdx = 1;

    if (title_ar !== undefined) { setClauses.push(`title_ar = $${paramIdx++}`); params.push(title_ar); }
    if (title_fr !== undefined) { setClauses.push(`title_fr = $${paramIdx++}`); params.push(title_fr); }
    if (link !== undefined) { setClauses.push(`link = $${paramIdx++}`); params.push(link); }
    if (is_active !== undefined) { setClauses.push(`is_active = $${paramIdx++}`); params.push(is_active !== 'false'); }
    if (sort_order !== undefined) { setClauses.push(`sort_order = $${paramIdx++}`); params.push(parseInt(sort_order) || 0); }

    if (req.file) {
      const oldResult = await query('SELECT image_url FROM promo_banners WHERE id = $1', [req.params.id]);
      if (oldResult.rows[0]?.image_url) deleteFile(oldResult.rows[0].image_url);
      setClauses.push(`image_url = $${paramIdx++}`);
      params.push(getFileUrl(req.file));
    }

    if (setClauses.length > 0) {
      params.push(req.params.id);
      await query(`UPDATE promo_banners SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`, params);
    }
    return res.json({ message: 'Promo banner updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update promo banner.' });
  }
});

router.delete('/promo-banners/:id', async (req, res) => {
  try {
    const result = await query('SELECT image_url FROM promo_banners WHERE id = $1', [req.params.id]);
    if (result.rows[0]?.image_url) deleteFile(result.rows[0].image_url);
    await query('DELETE FROM promo_banners WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Promo banner deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete promo banner.' });
  }
});

// ======================= TESTIMONIALS =======================

router.get('/testimonials', async (req, res) => {
  try {
    const result = await query('SELECT * FROM testimonials ORDER BY sort_order ASC');
    return res.json({ testimonials: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch testimonials.' });
  }
});

router.post('/testimonials', async (req, res) => {
  try {
    const { name_ar, name_fr, content_ar, content_fr, rating, is_active, sort_order } = req.body;
    const result = await query(
      `INSERT INTO testimonials (name_ar, name_fr, content_ar, content_fr, rating, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name_ar, name_fr, content_ar, content_fr, parseInt(rating) || 5, is_active !== false, parseInt(sort_order) || 0]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create testimonial.' });
  }
});

router.put('/testimonials/:id', async (req, res) => {
  try {
    const { name_ar, name_fr, content_ar, content_fr, rating, is_active, sort_order } = req.body;
    const setClauses = [];
    const params = [];
    let paramIdx = 1;

    if (name_ar !== undefined) { setClauses.push(`name_ar = $${paramIdx++}`); params.push(name_ar); }
    if (name_fr !== undefined) { setClauses.push(`name_fr = $${paramIdx++}`); params.push(name_fr); }
    if (content_ar !== undefined) { setClauses.push(`content_ar = $${paramIdx++}`); params.push(content_ar); }
    if (content_fr !== undefined) { setClauses.push(`content_fr = $${paramIdx++}`); params.push(content_fr); }
    if (rating !== undefined) { setClauses.push(`rating = $${paramIdx++}`); params.push(parseInt(rating)); }
    if (is_active !== undefined) { setClauses.push(`is_active = $${paramIdx++}`); params.push(is_active); }
    if (sort_order !== undefined) { setClauses.push(`sort_order = $${paramIdx++}`); params.push(parseInt(sort_order)); }

    if (setClauses.length > 0) {
      params.push(req.params.id);
      await query(`UPDATE testimonials SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`, params);
    }
    return res.json({ message: 'Testimonial updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update testimonial.' });
  }
});

router.delete('/testimonials/:id', async (req, res) => {
  try {
    await query('DELETE FROM testimonials WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Testimonial deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete testimonial.' });
  }
});

// ======================= SETTINGS =======================

router.get('/settings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM store_settings LIMIT 1');
    if (result.rows.length === 0) return res.status(404).json({ error: 'Settings not found.' });
    return res.json({ settings: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

router.put('/settings', setUploadFolder('settings'), upload.single('logo'), async (req, res) => {
  try {
    const { store_name, whatsapp_number, phone_number, email, address_ar, address_fr, facebook_url, instagram_url, tiktok_url } = req.body;
    const existingResult = await query('SELECT id, logo_url FROM store_settings LIMIT 1');
    if (existingResult.rows.length === 0) return res.status(404).json({ error: 'Settings not found.' });
    const existing = existingResult.rows[0];

    const setClauses = [];
    const params = [];
    let paramIdx = 1;

    if (store_name !== undefined) { setClauses.push(`store_name = $${paramIdx++}`); params.push(store_name); }
    if (whatsapp_number !== undefined) { setClauses.push(`whatsapp_number = $${paramIdx++}`); params.push(whatsapp_number); }
    if (phone_number !== undefined) { setClauses.push(`phone_number = $${paramIdx++}`); params.push(phone_number); }
    if (email !== undefined) { setClauses.push(`email = $${paramIdx++}`); params.push(email); }
    if (address_ar !== undefined) { setClauses.push(`address_ar = $${paramIdx++}`); params.push(address_ar); }
    if (address_fr !== undefined) { setClauses.push(`address_fr = $${paramIdx++}`); params.push(address_fr); }
    if (facebook_url !== undefined) { setClauses.push(`facebook_url = $${paramIdx++}`); params.push(facebook_url); }
    if (instagram_url !== undefined) { setClauses.push(`instagram_url = $${paramIdx++}`); params.push(instagram_url); }
    if (tiktok_url !== undefined) { setClauses.push(`tiktok_url = $${paramIdx++}`); params.push(tiktok_url); }

    if (req.file) {
      if (existing.logo_url) deleteFile(existing.logo_url);
      setClauses.push(`logo_url = $${paramIdx++}`);
      params.push(getFileUrl(req.file));
    }

    if (setClauses.length > 0) {
      params.push(existing.id);
      await query(`UPDATE store_settings SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`, params);
    }
    return res.json({ message: 'Settings updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update settings.' });
  }
});

module.exports = router;
