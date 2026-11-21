import { Router } from 'express';
import { query, getPool, seedIfEmpty } from '../db.js';

const router = Router();

// POST reset demo data
router.post('/', async (req, res) => {
  try {
    const p = await getPool();

    // Truncate/delete all tables in safe order
    await p.query('DELETE FROM activity_logs');
    await p.query('DELETE FROM transactions');
    await p.query('DELETE FROM reservations');
    await p.query('DELETE FROM housekeeping_tasks');
    await p.query('DELETE FROM expenses');
    await p.query('DELETE FROM rooms');
    await p.query('DELETE FROM guests');
    await p.query('DELETE FROM room_types');
    await p.query('DELETE FROM staff');
    await p.query('DELETE FROM users');
    await p.query('DELETE FROM hotel_settings');

    // Re-seed
    await seedIfEmpty(p);

    return res.json({ success: true, message: 'MySQL database successfully reset to clean seed data!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
