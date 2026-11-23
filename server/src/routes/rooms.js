import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all rooms for current tenant
router.get('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const rows = await query('SELECT * FROM rooms WHERE hotel_id = ? ORDER BY floor ASC, room_number ASC', [hotelId]);
    const rooms = rows.map(r => ({
      id: r.id,
      hotelId: r.hotel_id,
      roomNumber: r.room_number,
      roomTypeId: r.room_type_id,
      floor: r.floor,
      status: r.status,
      housekeepingStatus: r.housekeeping_status,
      currentGuestId: r.current_guest_id,
      currentGuestName: r.current_guest_name,
      currentReservationId: r.current_reservation_id,
      maintenanceNotes: r.maintenance_notes,
    }));
    return res.json({ success: true, rooms });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST add room for current tenant
router.post('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const { roomNumber, roomTypeId, floor, status, housekeepingStatus, maintenanceNotes } = req.body;
    if (!roomNumber || !roomTypeId) {
      return res.status(400).json({ success: false, message: 'Room number and room type are required.' });
    }

    const existing = await query('SELECT id FROM rooms WHERE hotel_id = ? AND room_number = ?', [hotelId, roomNumber]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Room ${roomNumber} already exists in this hotel.` });
    }

    const id = `${hotelId}_${roomNumber}`;
    await query(`
      INSERT INTO rooms (id, hotel_id, room_number, room_type_id, floor, status, housekeeping_status, maintenance_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, hotelId, roomNumber, roomTypeId, floor || 1, status || 'Available',
      housekeepingStatus || 'Clean', maintenanceNotes || null
    ]);

    // Activity log
    await query(`
      INSERT INTO activity_logs (id, hotel_id, timestamp, user_name, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `LOG-${Date.now()}`, hotelId, new Date().toISOString().replace('T', ' ').slice(0, 16),
      'Admin', 'Room Created', 'Room', roomNumber, `Added new room ${roomNumber} to inventory.`
    ]);

    const newRoom = {
      id,
      hotelId,
      roomNumber,
      roomTypeId,
      floor: floor || 1,
      status: status || 'Available',
      housekeepingStatus: housekeepingStatus || 'Clean',
      maintenanceNotes: maintenanceNotes || null,
    };

    return res.status(201).json({ success: true, message: `Room ${roomNumber} added successfully.`, room: newRoom });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update room
router.put('/:id', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    if (updates.roomNumber !== undefined) { fields.push('room_number = ?'); values.push(updates.roomNumber); }
    if (updates.roomTypeId !== undefined) { fields.push('room_type_id = ?'); values.push(updates.roomTypeId); }
    if (updates.floor !== undefined) { fields.push('floor = ?'); values.push(updates.floor); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.housekeepingStatus !== undefined) { fields.push('housekeeping_status = ?'); values.push(updates.housekeepingStatus); }
    if (updates.currentGuestId !== undefined) { fields.push('current_guest_id = ?'); values.push(updates.currentGuestId); }
    if (updates.currentGuestName !== undefined) { fields.push('current_guest_name = ?'); values.push(updates.currentGuestName); }
    if (updates.currentReservationId !== undefined) { fields.push('current_reservation_id = ?'); values.push(updates.currentReservationId); }
    if (updates.maintenanceNotes !== undefined) { fields.push('maintenance_notes = ?'); values.push(updates.maintenanceNotes); }

    if (fields.length > 0) {
      values.push(id, hotelId);
      await query(`UPDATE rooms SET ${fields.join(', ')} WHERE (id = ? OR room_number = ?) AND hotel_id = ?`, [
        ...values.slice(0, -2), id, id, hotelId
      ]);
    }

    return res.json({ success: true, message: `Room ${id} updated successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE room
router.delete('/:id', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const { id } = req.params;
    const rooms = await query('SELECT * FROM rooms WHERE (id = ? OR room_number = ?) AND hotel_id = ?', [id, id, hotelId]);
    if (rooms.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const room = rooms[0];
    if (room.status === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete Room ${room.room_number}. An active guest is currently staying in this room.`
      });
    }

    await query('DELETE FROM rooms WHERE id = ? AND hotel_id = ?', [room.id, hotelId]);

    return res.json({ success: true, message: `Room ${room.room_number} deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
