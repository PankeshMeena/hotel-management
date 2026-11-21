import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all room types
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM room_types ORDER BY base_price ASC');
    const roomTypes = rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      basePrice: Number(r.base_price),
      maxOccupancy: r.max_occupancy,
      amenities: typeof r.amenities === 'string' ? JSON.parse(r.amenities) : (r.amenities || []),
      extraGuestCharge: Number(r.extra_guest_charge),
      isActive: Boolean(r.is_active),
      image: r.image,
    }));
    return res.json({ success: true, roomTypes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE room type
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.basePrice !== undefined) { fields.push('base_price = ?'); values.push(updates.basePrice); }
    if (updates.maxOccupancy !== undefined) { fields.push('max_occupancy = ?'); values.push(updates.maxOccupancy); }
    if (updates.amenities !== undefined) { fields.push('amenities = ?'); values.push(JSON.stringify(updates.amenities)); }
    if (updates.extraGuestCharge !== undefined) { fields.push('extra_guest_charge = ?'); values.push(updates.extraGuestCharge); }
    if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }
    if (updates.image !== undefined) { fields.push('image = ?'); values.push(updates.image); }

    if (fields.length > 0) {
      values.push(id);
      await query(`UPDATE room_types SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return res.json({ success: true, message: `Room type ${id} updated` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
