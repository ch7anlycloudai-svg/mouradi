const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'wwenatou-secret-key-change-in-production';

/**
 * Verify JWT token from Authorization header.
 * Attaches decoded user info to req.user on success.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

/**
 * Verify the token AND check the user exists in admin_users table.
 * Must be used after or instead of `authenticate`.
 */
const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify admin exists in database
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('id', decoded.id)
      .single();

    if (error || !admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    req.user = { ...decoded, ...admin };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

/**
 * Generate a JWT token for an admin user.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { authenticate, isAdmin, generateToken, JWT_SECRET };
