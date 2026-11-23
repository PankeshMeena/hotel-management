import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all activity logs for current tenant
router.get('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const limit = Number(req.query.limit) || 100;
    const rows = await query('SELECT * FROM activity_logs WHERE hotel_id = ? ORDER BY timestamp DESC LIMIT ?', [hotelId, limit]);
    const activityLogs = rows.map(l => ({
      id: l.id,
      hotelId: l.hotel_id,
      timestamp: l.timestamp,
      userName: l.user_name,
      userRole: l.user_role,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      description: l.description,
    }));
    return res.json({ success: true, activityLogs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST add activity log for current tenant
router.post('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const { action, entityType, entityId, description, userName, userRole } = req.body;
    const id = `LOG-${Date.now()}`;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    await query(`
      INSERT INTO activity_logs (id, hotel_id, timestamp, user_name, user_role, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, hotelId, timestamp, userName || 'System', userRole || 'System',
      action, entityType, entityId, description
    ]);

    return res.status(201).json({ success: true, id });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
