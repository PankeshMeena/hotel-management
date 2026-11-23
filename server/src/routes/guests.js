import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all guests for current tenant
router.get('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const rows = await query('SELECT * FROM guests WHERE hotel_id = ? ORDER BY created_at DESC', [hotelId]);
    const guests = rows.map(g => ({
      id: g.id,
      hotelId: g.hotel_id,
      fullName: g.full_name,
      mobile: g.mobile,
      email: g.email,
      address: g.address,
      city: g.city,
      state: g.state,
      country: g.country,
      idDocumentType: g.id_document_type,
      idDocumentNumber: g.id_document_number,
      idVerificationStatus: g.id_verification_status,
      idDocumentPhoto: g.id_document_photo,
      emergencyContact: g.emergency_contact,
      notes: g.notes,
      totalStays: Number(g.total_stays),
      totalSpent: Number(g.total_spent),
      createdAt: g.created_at,
    }));
    return res.json({ success: true, guests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST add guest for current tenant
router.post('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const g = req.body;
    if (!g.fullName || !g.mobile) {
      return res.status(400).json({ success: false, message: 'Full name and mobile are required.' });
    }

    // Auto generate ID if not supplied
    let guestId = g.id;
    if (!guestId) {
      const countRes = await query('SELECT COUNT(*) as count FROM guests WHERE hotel_id = ?', [hotelId]);
      const nextNum = (countRes[0].count + 1).toString().padStart(3, '0');
      guestId = `GST-${nextNum}`;
    }

    const createdAt = g.createdAt || new Date().toISOString().slice(0, 10);

    await query(`
      INSERT INTO guests (
        id, hotel_id, full_name, mobile, email, address, city, state, country,
        id_document_type, id_document_number, id_verification_status, id_document_photo,
        emergency_contact, notes, total_stays, total_spent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        mobile = VALUES(mobile),
        email = VALUES(email),
        id_document_photo = IFNULL(VALUES(id_document_photo), id_document_photo)
    `, [
      guestId, hotelId, g.fullName, g.mobile, g.email || null, g.address || '', g.city || '', g.state || '', g.country || 'India',
      g.idDocumentType || 'Aadhaar', g.idDocumentNumber || '', g.idVerificationStatus || 'Pending',
      g.idDocumentPhoto || null, g.emergencyContact || null, g.notes || null,
      g.totalStays || 0, g.totalSpent || 0, createdAt
    ]);

    const created = {
      id: guestId,
      hotelId,
      fullName: g.fullName,
      mobile: g.mobile,
      email: g.email || null,
      address: g.address || '',
      city: g.city || '',
      state: g.state || '',
      country: g.country || 'India',
      idDocumentType: g.idDocumentType || 'Aadhaar',
      idDocumentNumber: g.idDocumentNumber || '',
      idVerificationStatus: g.idVerificationStatus || 'Pending',
      idDocumentPhoto: g.idDocumentPhoto || null,
      emergencyContact: g.emergencyContact || null,
      notes: g.notes || null,
      totalStays: g.totalStays || 0,
      totalSpent: g.totalSpent || 0,
      createdAt,
    };

    return res.status(201).json({ success: true, message: 'Guest added successfully', guest: created });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update guest
router.put('/:id', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const { id } = req.params;
    const g = req.body;

    const fields = [];
    const values = [];

    if (g.fullName !== undefined) { fields.push('full_name = ?'); values.push(g.fullName); }
    if (g.mobile !== undefined) { fields.push('mobile = ?'); values.push(g.mobile); }
    if (g.email !== undefined) { fields.push('email = ?'); values.push(g.email); }
    if (g.address !== undefined) { fields.push('address = ?'); values.push(g.address); }
    if (g.city !== undefined) { fields.push('city = ?'); values.push(g.city); }
    if (g.state !== undefined) { fields.push('state = ?'); values.push(g.state); }
    if (g.country !== undefined) { fields.push('country = ?'); values.push(g.country); }
    if (g.idDocumentType !== undefined) { fields.push('id_document_type = ?'); values.push(g.idDocumentType); }
    if (g.idDocumentNumber !== undefined) { fields.push('id_document_number = ?'); values.push(g.idDocumentNumber); }
    if (g.idVerificationStatus !== undefined) { fields.push('id_verification_status = ?'); values.push(g.idVerificationStatus); }
    if (g.idDocumentPhoto !== undefined) { fields.push('id_document_photo = ?'); values.push(g.idDocumentPhoto); }
    if (g.emergencyContact !== undefined) { fields.push('emergency_contact = ?'); values.push(g.emergencyContact); }
    if (g.notes !== undefined) { fields.push('notes = ?'); values.push(g.notes); }
    if (g.totalStays !== undefined) { fields.push('total_stays = ?'); values.push(g.totalStays); }
    if (g.totalSpent !== undefined) { fields.push('total_spent = ?'); values.push(g.totalSpent); }

    if (fields.length > 0) {
      values.push(id, hotelId);
      await query(`UPDATE guests SET ${fields.join(', ')} WHERE id = ? AND hotel_id = ?`, values);
    }

    return res.json({ success: true, message: `Guest ${id} updated` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
