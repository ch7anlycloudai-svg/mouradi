const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken, authenticate } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// POST /api/auth/login - Admin login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find admin by email
    const result = await query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const admin = result.rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = generateToken(admin);

    return res.json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/verify - Verify JWT token validity
// ---------------------------------------------------------------------------
router.get('/verify', authenticate, async (req, res) => {
  try {
    // Token is already verified by middleware; confirm user still exists
    const result = await query(
      'SELECT id, email FROM admin_users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    return res.json({
      valid: true,
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Token verify error:', err);
    return res.status(500).json({ error: 'Verification failed.' });
  }
});

module.exports = router;
