import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all expenses
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM expenses ORDER BY date DESC, created_at DESC');
    const expenses = rows.map(e => ({
      id: e.id,
      date: e.date,
      category: e.category,
      description: e.description,
      amount: Number(e.amount),
      paymentMethod: e.payment_method,
      vendor: e.vendor,
      recordedBy: e.recorded_by,
      hasReceipt: Boolean(e.has_receipt),
      receiptPhoto: e.receipt_photo,
      createdAt: e.created_at,
    }));
    return res.json({ success: true, expenses });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST add expense
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const countRes = await query('SELECT COUNT(*) as count FROM expenses');
    const newId = data.id || `EXP-${100 + countRes[0].count + 1}`;
    const createdAt = data.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 16);

    await query(`
      INSERT INTO expenses (id, date, category, description, amount, payment_method, vendor, recorded_by, has_receipt, receipt_photo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newId, data.date || new Date().toISOString().slice(0, 10), data.category || 'Other',
      data.description, data.amount, data.paymentMethod || 'Cash',
      data.vendor || null, data.recordedBy || 'Admin',
      data.hasReceipt || data.receiptPhoto ? 1 : 0, data.receiptPhoto || null, createdAt
    ]);

    // Activity log
    await query(`
      INSERT INTO activity_logs (id, timestamp, user_name, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `LOG-${Date.now()}`, createdAt, data.recordedBy || 'Admin',
      'Expense Recorded', 'Expense', newId,
      `Recorded ${data.category} expense of ₹${data.amount}: "${data.description}".`
    ]);

    const created = {
      id: newId,
      date: data.date || new Date().toISOString().slice(0, 10),
      category: data.category || 'Other',
      description: data.description,
      amount: data.amount,
      paymentMethod: data.paymentMethod || 'Cash',
      vendor: data.vendor || null,
      recordedBy: data.recordedBy || 'Admin',
      hasReceipt: Boolean(data.hasReceipt || data.receiptPhoto),
      receiptPhoto: data.receiptPhoto || null,
      createdAt,
    };

    return res.status(201).json({ success: true, message: 'Expense recorded successfully.', expense: created });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM expenses WHERE id = ?', [id]);
    return res.json({ success: true, message: `Expense ${id} deleted.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
