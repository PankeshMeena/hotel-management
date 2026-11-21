import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all staff
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM staff ORDER BY name ASC');
    const staff = rows.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      mobile: s.mobile,
      role: s.role,
      status: s.status,
      joiningDate: s.joining_date,
      avatar: s.avatar,
    }));
    return res.json({ success: true, staff });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST add staff
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const countRes = await query('SELECT COUNT(*) as count FROM staff');
    const newId = data.id || `STF-${(countRes[0].count + 1).toString().padStart(3, '0')}`;
    const joiningDate = data.joiningDate || new Date().toISOString().slice(0, 10);

    await query(`
      INSERT INTO staff (id, name, email, mobile, role, status, joining_date, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newId, data.name, data.email || null, data.mobile,
      data.role || 'Receptionist', data.status || 'Active',
      joiningDate, data.avatar || null
    ]);

    const created = {
      id: newId,
      name: data.name,
      email: data.email || null,
      mobile: data.mobile,
      role: data.role || 'Receptionist',
      status: data.status || 'Active',
      joiningDate,
      avatar: data.avatar || null,
    };

    return res.status(201).json({ success: true, message: `Staff member ${data.name} added.`, staff: created });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update staff
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
    if (updates.mobile !== undefined) { fields.push('mobile = ?'); values.push(updates.mobile); }
    if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.joiningDate !== undefined) { fields.push('joining_date = ?'); values.push(updates.joiningDate); }
    if (updates.avatar !== undefined) { fields.push('avatar = ?'); values.push(updates.avatar); }

    if (fields.length > 0) {
      values.push(id);
      await query(`UPDATE staff SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return res.json({ success: true, message: `Staff member ${id} updated.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
