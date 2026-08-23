const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validateProduct = [
  body('name_ar').trim().notEmpty().withMessage('Arabic name is required.'),
  body('name_fr').trim().notEmpty().withMessage('French name is required.'),
  body('price').notEmpty().withMessage('Price is required.').isFloat({ min: 0 }),
  body('category_id').optional({ nullable: true }).isUUID(),
  body('old_price').optional({ nullable: true }).isFloat({ min: 0 }),
  handleValidation,
];

const validateOrder = [
  body('customer_name').trim().notEmpty().withMessage('Customer name is required.'),
  body('customer_phone').trim().notEmpty().withMessage('Phone is required.'),
  body('customer_province').trim().notEmpty().withMessage('Province is required.'),
  body('customer_address').trim().notEmpty().withMessage('Address is required.'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required.'),
  body('items.*.product_id').notEmpty().isUUID(),
  body('items.*.quantity').notEmpty().isInt({ min: 1 }),
  body('coupon_code').optional({ nullable: true }).trim(),
  body('customer_notes').optional({ nullable: true }).trim(),
  handleValidation,
];

const validateCoupon = [
  body('code').trim().notEmpty().withMessage('Code is required.').toUpperCase(),
  body('discount_type').notEmpty().isIn(['percentage', 'fixed']),
  body('discount_value').notEmpty().isFloat({ min: 0 }),
  body('min_order_amount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('max_uses').optional({ nullable: true }).isInt({ min: 1 }),
  body('expires_at').optional({ nullable: true }),
  body('is_active').optional().isBoolean(),
  handleValidation,
];

module.exports = {
  validateProduct,
  validateOrder,
  validateCoupon,
  handleValidation,
};
