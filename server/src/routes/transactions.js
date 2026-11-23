import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all transactions for current tenant
router.get('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const rows = await query('SELECT * FROM transactions WHERE hotel_id = ? ORDER BY created_at DESC', [hotelId]);
    const transactions = rows.map(t => ({
      id: t.id,
      hotelId: t.hotel_id,
      reservationId: t.reservation_id,
      guestName: t.guest_name,
      roomNumber: t.room_number,
      amount: Number(t.amount),
      type: t.type,
      paymentMethod: t.method,
      referenceNo: t.reference_no,
      notes: t.notes,
      recordedBy: t.recorded_by,
      createdAt: t.created_at,
    }));
    return res.json({ success: true, transactions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST record payment / refund
router.post('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const p = req.body;
    const txId = p.id || `TXN-${Date.now()}`;
    const createdAt = p.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 16);

    await query(`
      INSERT INTO transactions (id, hotel_id, reservation_id, guest_name, room_number, amount, type, method, reference_no, notes, recorded_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      txId, hotelId, p.reservationId || null, p.guestName || '', p.roomNumber || null,
      p.amount, p.type || 'Payment', p.paymentMethod || 'Cash',
      p.referenceNo || null, p.notes || null, p.recordedBy || 'Front Desk', createdAt
    ]);

    // If linked to reservation, update reservation balance
    if (p.reservationId) {
      if (p.type === 'Payment' || p.type === 'Advance') {
        await query(`
          UPDATE reservations SET
            advance_paid = advance_paid + ?,
            balance_amount = GREATEST(0, balance_amount - ?)
          WHERE id = ? AND hotel_id = ?
        `, [p.amount, p.amount, p.reservationId, hotelId]);
      } else if (p.type === 'Refund') {
        await query(`
          UPDATE reservations SET
            balance_amount = balance_amount + ?
          WHERE id = ? AND hotel_id = ?
        `, [p.amount, p.reservationId, hotelId]);
      }
    }

    // Activity log
    await query(`
      INSERT INTO activity_logs (id, hotel_id, timestamp, user_name, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `LOG-${Date.now()}`, hotelId, createdAt, p.recordedBy || 'Front Desk',
      `${p.type || 'Payment'} Recorded`, 'Payment', txId,
      `Recorded ${p.type || 'Payment'} of ₹${p.amount} via ${p.paymentMethod || 'Cash'} for ${p.guestName || 'Guest'}.`
    ]);

    const createdTx = {
      id: txId,
      hotelId,
      reservationId: p.reservationId,
      guestName: p.guestName,
      roomNumber: p.roomNumber,
      amount: p.amount,
      type: p.type || 'Payment',
      paymentMethod: p.paymentMethod || 'Cash',
      referenceNo: p.referenceNo || null,
      notes: p.notes || null,
      recordedBy: p.recordedBy || 'Front Desk',
      createdAt,
    };

    return res.status(201).json({ success: true, message: 'Transaction recorded successfully', transaction: createdTx });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
