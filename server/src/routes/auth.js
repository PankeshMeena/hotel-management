import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const user = users[0];
    // Password check (supports Demo@123 or direct match)
    if (user.password && user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check credentials.' });
    }

    // Return safe user object
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    return res.json({ success: true, message: 'Login successful', user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await query('SELECT id, name, email, role, avatar, created_at FROM users');
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
