import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all guests
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM guests ORDER BY created_at DESC');
    const guests = rows.map(g => ({
      id: g.id,
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

// POST add guest
router.post('/', async (req, res) => {
  try {
    const g = req.body;
    if (!g.fullName || !g.mobile) {
      return res.status(400).json({ success: false, message: 'Full name and mobile are required.' });
    }

    // Auto generate ID if not supplied
    let guestId = g.id;
    if (!guestId) {
      const countRes = await query('SELECT COUNT(*) as count FROM guests');
      const nextNum = (countRes[0].count + 1).toString().padStart(3, '0');
      guestId = `GST-${nextNum}`;
    }

    const createdAt = g.createdAt || new Date().toISOString().slice(0, 10);

    await query(`
      INSERT INTO guests (
        id, full_name, mobile, email, address, city, state, country,
        id_document_type, id_document_number, id_verification_status, id_document_photo,
        emergency_contact, notes, total_stays, total_spent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        mobile = VALUES(mobile),
        email = VALUES(email),
        id_document_photo = IFNULL(VALUES(id_document_photo), id_document_photo)
    `, [
      guestId, g.fullName, g.mobile, g.email || null, g.address || '', g.city || '', g.state || '', g.country || 'India',
      g.idDocumentType || 'Aadhaar', g.idDocumentNumber || '', g.idVerificationStatus || 'Pending',
      g.idDocumentPhoto || null, g.emergencyContact || null, g.notes || null,
      g.totalStays || 0, g.totalSpent || 0, createdAt
    ]);

    const created = {
      id: guestId,
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
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    if (updates.fullName !== undefined) { fields.push('full_name = ?'); values.push(updates.fullName); }
    if (updates.mobile !== undefined) { fields.push('mobile = ?'); values.push(updates.mobile); }
    if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
    if (updates.address !== undefined) { fields.push('address = ?'); values.push(updates.address); }
    if (updates.city !== undefined) { fields.push('city = ?'); values.push(updates.city); }
    if (updates.state !== undefined) { fields.push('state = ?'); values.push(updates.state); }
    if (updates.country !== undefined) { fields.push('country = ?'); values.push(updates.country); }
    if (updates.idDocumentType !== undefined) { fields.push('id_document_type = ?'); values.push(updates.idDocumentType); }
    if (updates.idDocumentNumber !== undefined) { fields.push('id_document_number = ?'); values.push(updates.idDocumentNumber); }
    if (updates.idVerificationStatus !== undefined) { fields.push('id_verification_status = ?'); values.push(updates.idVerificationStatus); }
    if (updates.idDocumentPhoto !== undefined) { fields.push('id_document_photo = ?'); values.push(updates.idDocumentPhoto); }
    if (updates.emergencyContact !== undefined) { fields.push('emergency_contact = ?'); values.push(updates.emergencyContact); }
    if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }
    if (updates.totalStays !== undefined) { fields.push('total_stays = ?'); values.push(updates.totalStays); }
    if (updates.totalSpent !== undefined) { fields.push('total_spent = ?'); values.push(updates.totalSpent); }

    if (fields.length > 0) {
      values.push(id);
      await query(`UPDATE guests SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return res.json({ success: true, message: `Guest ${id} updated successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
