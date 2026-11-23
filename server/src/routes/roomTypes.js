import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all room types for current tenant
router.get('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const rows = await query('SELECT * FROM room_types WHERE hotel_id = ? ORDER BY base_price ASC', [hotelId]);
    const roomTypes = rows.map(r => ({
      id: r.id,
      hotelId: r.hotel_id,
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

// POST add room type for current tenant
router.post('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const { name, description, basePrice, maxOccupancy, amenities, extraGuestCharge, isActive, image } = req.body;
    const id = `rt_${hotelId}_${Date.now()}`;
    await query(`
      INSERT INTO room_types (id, hotel_id, name, description, base_price, max_occupancy, amenities, extra_guest_charge, is_active, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, hotelId, name, description || '', basePrice || 2000, maxOccupancy || 2,
      JSON.stringify(amenities || []), extraGuestCharge || 400, isActive !== false ? 1 : 0, image || null
    ]);
    return res.status(201).json({ success: true, roomType: { id, name, basePrice } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE room type
router.put('/:id', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
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
      values.push(id, hotelId);
      await query(`UPDATE room_types SET ${fields.join(', ')} WHERE id = ? AND hotel_id = ?`, values);
    }

    return res.json({ success: true, message: `Room type ${id} updated` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
