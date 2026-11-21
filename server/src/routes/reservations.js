import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Helper to check if two date ranges overlap
function datesOverlap(in1, out1, in2, out2) {
  return !(new Date(out1) <= new Date(in2) || new Date(in1) >= new Date(out2));
}

// GET all reservations
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM reservations ORDER BY created_at DESC');
    const reservations = rows.map(r => ({
      id: r.id,
      guestId: r.guest_id,
      guestName: r.guest_name,
      guestMobile: r.guest_mobile,
      guestEmail: r.guest_email,
      roomTypeId: r.room_type_id,
      roomNumber: r.room_number,
      assignedRoomNumbers: typeof r.assigned_room_numbers === 'string' ? JSON.parse(r.assigned_room_numbers) : (r.assigned_room_numbers || [r.room_number]),
      members: typeof r.members === 'string' ? JSON.parse(r.members) : (r.members || []),
      adults: r.adults,
      children: r.children,
      checkInDate: r.check_in_date,
      checkOutDate: r.check_out_date,
      numberOfNights: r.number_of_nights,
      ratePerNight: Number(r.rate_per_night),
      discount: Number(r.discount),
      taxAmount: Number(r.tax_amount),
      totalAmount: Number(r.total_amount),
      advancePaid: Number(r.advance_paid),
      balanceAmount: Number(r.balance_amount),
      bookingSource: r.booking_source,
      status: r.status,
      idDocumentPhoto: r.id_document_photo,
      actualCheckInTime: r.actual_check_in_time,
      actualCheckOutTime: r.actual_check_out_time,
      specialRequests: r.special_requests,
      cancellationReason: r.cancellation_reason,
      createdBy: r.created_by,
      createdAt: r.created_at,
    }));
    return res.json({ success: true, reservations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST create reservation
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const targetRooms = (data.assignedRoomNumbers && data.assignedRoomNumbers.length > 0)
      ? data.assignedRoomNumbers
      : [data.roomNumber];

    // Conflict check against active reservations
    const active = await query(`
      SELECT id, guest_name, check_in_date, check_out_date, room_number, assigned_room_numbers
      FROM reservations
      WHERE status IN ('Confirmed', 'Checked In', 'Pending')
    `);

    for (const r of active) {
      const rRooms = r.assigned_room_numbers ? (typeof r.assigned_room_numbers === 'string' ? JSON.parse(r.assigned_room_numbers) : r.assigned_room_numbers) : [r.room_number];
      const conflictRoom = targetRooms.find(rm => rRooms.includes(rm));
      if (conflictRoom && datesOverlap(r.check_in_date, r.check_out_date, data.checkInDate, data.checkOutDate)) {
        return res.status(409).json({
          success: false,
          message: `Room ${conflictRoom} is already booked for ${r.guest_name} between ${r.check_in_date} and ${r.check_out_date}. Please choose another room.`
        });
      }
    }

    // Generate ID
    const countRes = await query('SELECT COUNT(*) as count FROM reservations');
    const newId = `RES-${1000 + countRes[0].count + 1}`;
    const createdAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

    await query(`
      INSERT INTO reservations (
        id, guest_id, guest_name, guest_mobile, guest_email, room_type_id, room_number,
        assigned_room_numbers, members, adults, children, check_in_date, check_out_date,
        number_of_nights, rate_per_night, discount, tax_amount, total_amount, advance_paid,
        balance_amount, booking_source, status, id_document_photo, special_requests,
        created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newId, data.guestId, data.guestName, data.guestMobile, data.guestEmail || null,
      data.roomTypeId, data.roomNumber, JSON.stringify(targetRooms),
      JSON.stringify(data.members || []), data.adults || 1, data.children || 0,
      data.checkInDate, data.checkOutDate, data.numberOfNights || 1, data.ratePerNight,
      data.discount || 0, data.taxAmount || 0, data.totalAmount, data.advancePaid || 0,
      data.balanceAmount || 0, data.bookingSource || 'Direct Walk-in', data.status || 'Confirmed',
      data.idDocumentPhoto || null, data.specialRequests || null, data.createdBy || 'Front Desk', createdAt
    ]);

    // Update room status to Reserved if confirmed
    if (data.status === 'Confirmed' || data.status === 'Pending') {
      for (const rm of targetRooms) {
        await query(`
          UPDATE rooms SET status = 'Reserved', current_reservation_id = ?
          WHERE room_number = ? AND status = 'Available'
        `, [newId, rm]);
      }
    }

    // Record advance payment transaction if applicable
    if (data.advancePaid && data.advancePaid > 0) {
      const txId = `TXN-${Date.now()}`;
      await query(`
        INSERT INTO transactions (id, reservation_id, guest_name, room_number, amount, type, method, notes, recorded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        txId, newId, data.guestName, data.roomNumber, data.advancePaid, 'Advance',
        data.paymentMethod || 'Cash', 'Advance token received at booking', data.createdBy || 'Front Desk', createdAt
      ]);
    }

    // Activity log
    await query(`
      INSERT INTO activity_logs (id, timestamp, user_name, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `LOG-${Date.now()}`, createdAt, data.createdBy || 'Front Desk',
      'Reservation Created', 'Reservation', newId,
      `Created reservation ${newId} for ${data.guestName} in Room ${targetRooms.join(', ')} (${data.checkInDate} to ${data.checkOutDate}).`
    ]);

    const createdRes = {
      id: newId,
      guestId: data.guestId,
      guestName: data.guestName,
      guestMobile: data.guestMobile,
      guestEmail: data.guestEmail || null,
      roomTypeId: data.roomTypeId,
      roomNumber: data.roomNumber,
      assignedRoomNumbers: targetRooms,
      members: data.members || [],
      adults: data.adults || 1,
      children: data.children || 0,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      numberOfNights: data.numberOfNights || 1,
      ratePerNight: data.ratePerNight,
      discount: data.discount || 0,
      taxAmount: data.taxAmount || 0,
      totalAmount: data.totalAmount,
      advancePaid: data.advancePaid || 0,
      balanceAmount: data.balanceAmount || 0,
      bookingSource: data.bookingSource || 'Direct Walk-in',
      status: data.status || 'Confirmed',
      idDocumentPhoto: data.idDocumentPhoto || null,
      specialRequests: data.specialRequests || null,
      createdBy: data.createdBy || 'Front Desk',
      createdAt,
    };

    return res.status(201).json({
      success: true,
      message: `Reservation ${newId} created successfully.`,
      reservation: createdRes
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST Check-in reservation
router.post('/:id/checkin', async (req, res) => {
  try {
    const { id } = req.params;
    const reservations = await query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (reservations.length === 0) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    const r = reservations[0];
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const assignedRooms = r.assigned_room_numbers ? (typeof r.assigned_room_numbers === 'string' ? JSON.parse(r.assigned_room_numbers) : r.assigned_room_numbers) : [r.room_number];

    // Update reservation
    await query(`
      UPDATE reservations SET status = 'Checked In', actual_check_in_time = ? WHERE id = ?
    `, [nowTime, id]);

    // Update rooms to Occupied
    for (const rm of assignedRooms) {
      await query(`
        UPDATE rooms SET
          status = 'Occupied',
          current_guest_id = ?,
          current_guest_name = ?,
          current_reservation_id = ?
        WHERE room_number = ?
      `, [r.guest_id, r.guest_name, id, rm]);
    }

    // Activity log
    await query(`
      INSERT INTO activity_logs (id, timestamp, user_name, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `LOG-${Date.now()}`, nowTime, 'Front Desk',
      'Guest Check-In', 'Reservation', id,
      `Guest ${r.guest_name} checked in to Room ${assignedRooms.join(', ')}.`
    ]);

    return res.json({ success: true, message: `Guest ${r.guest_name} checked in successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST Cancel reservation
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const reservations = await query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (reservations.length === 0) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    const r = reservations[0];
    const assignedRooms = r.assigned_room_numbers ? (typeof r.assigned_room_numbers === 'string' ? JSON.parse(r.assigned_room_numbers) : r.assigned_room_numbers) : [r.room_number];

    await query(`
      UPDATE reservations SET status = 'Cancelled', cancellation_reason = ? WHERE id = ?
    `, [reason || 'Guest requested cancellation', id]);

    // Release rooms back to Available if they were Reserved for this booking
    for (const rm of assignedRooms) {
      await query(`
        UPDATE rooms SET status = 'Available', current_reservation_id = NULL
        WHERE room_number = ? AND current_reservation_id = ?
      `, [rm, id]);
    }

    // Activity log
    await query(`
      INSERT INTO activity_logs (id, timestamp, user_name, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `LOG-${Date.now()}`, new Date().toISOString().replace('T', ' ').slice(0, 16),
      'Front Desk', 'Reservation Cancelled', 'Reservation', id,
      `Reservation ${id} for ${r.guest_name} cancelled. Reason: ${reason || 'Guest requested'}`
    ]);

    return res.json({ success: true, message: `Reservation ${id} cancelled successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST Walk-in Check-in
router.post('/walkin', async (req, res) => {
  try {
    const payload = req.body;
    const guestData = payload.guest;

    // Check or create guest
    let guestId = guestData.id;
    if (!guestId) {
      const existing = await query('SELECT id FROM guests WHERE mobile = ?', [guestData.mobile]);
      if (existing.length > 0) {
        guestId = existing[0].id;
        // update photo if provided
        if (guestData.idDocumentPhoto) {
          await query('UPDATE guests SET id_document_photo = ? WHERE id = ?', [guestData.idDocumentPhoto, guestId]);
        }
      } else {
        const countRes = await query('SELECT COUNT(*) as count FROM guests');
        guestId = `GST-${(countRes[0].count + 1).toString().padStart(3, '0')}`;
        await query(`
          INSERT INTO guests (
            id, full_name, mobile, email, address, city, state, country,
            id_document_type, id_document_number, id_verification_status, id_document_photo,
            emergency_contact, notes, total_stays, total_spent, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          guestId, guestData.fullName, guestData.mobile, guestData.email || null,
          guestData.address || '', guestData.city || '', guestData.state || '', guestData.country || 'India',
          guestData.idDocumentType || 'Aadhaar', guestData.idDocumentNumber || '',
          guestData.idVerificationStatus || 'Verified', guestData.idDocumentPhoto || null,
          guestData.emergencyContact || null, guestData.notes || null, 1, 0,
          new Date().toISOString().slice(0, 10)
        ]);
      }
    }

    // Reservation creation
    const countRes = await query('SELECT COUNT(*) as count FROM reservations');
    const newResId = `RES-${1000 + countRes[0].count + 1}`;
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const nights = Math.max(1, Math.ceil((new Date(payload.checkOutDate) - new Date(payload.checkInDate)) / (1000 * 60 * 60 * 24)));
    const subtotal = nights * payload.ratePerNight - (payload.discount || 0);
    const taxAmount = Math.round(subtotal * 0.12);
    const totalAmount = subtotal + taxAmount;
    const balanceAmount = Math.max(0, totalAmount - (payload.advancePaid || 0));

    await query(`
      INSERT INTO reservations (
        id, guest_id, guest_name, guest_mobile, guest_email, room_type_id, room_number,
        assigned_room_numbers, adults, children, check_in_date, check_out_date,
        number_of_nights, rate_per_night, discount, tax_amount, total_amount, advance_paid,
        balance_amount, booking_source, status, id_document_photo, actual_check_in_time,
        special_requests, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newResId, guestId, guestData.fullName, guestData.mobile, guestData.email || null,
      payload.roomTypeId, payload.roomNumber, JSON.stringify([payload.roomNumber]),
      payload.adults || 1, payload.children || 0, payload.checkInDate, payload.checkOutDate,
      nights, payload.ratePerNight, payload.discount || 0, taxAmount, totalAmount,
      payload.advancePaid || 0, balanceAmount, 'Direct Walk-in', 'Checked In',
      guestData.idDocumentPhoto || null, nowTime, payload.specialRequests || null,
      'Front Desk', nowTime
    ]);

    // Mark room Occupied
    await query(`
      UPDATE rooms SET
        status = 'Occupied',
        current_guest_id = ?,
        current_guest_name = ?,
        current_reservation_id = ?
      WHERE room_number = ?
    `, [guestId, guestData.fullName, newResId, payload.roomNumber]);

    // Record payment if advance received
    if (payload.advancePaid && payload.advancePaid > 0) {
      const txId = `TXN-${Date.now()}`;
      await query(`
        INSERT INTO transactions (id, reservation_id, guest_name, room_number, amount, type, method, notes, recorded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        txId, newResId, guestData.fullName, payload.roomNumber, payload.advancePaid,
        'Advance', payload.paymentMethod || 'Cash', 'Walk-in instant check-in payment', 'Front Desk', nowTime
      ]);
    }

    // Activity log
    await query(`
      INSERT INTO activity_logs (id, timestamp, user_name, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `LOG-${Date.now()}`, nowTime, 'Front Desk', 'Walk-in Check-In', 'Reservation', newResId,
      `Walk-in check-in completed for ${guestData.fullName} in Room ${payload.roomNumber}. Total: ₹${totalAmount}`
    ]);

    return res.status(201).json({
      success: true,
      message: `Walk-in check-in successful for ${guestData.fullName} in Room ${payload.roomNumber}!`,
      reservationId: newResId
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST Check-out
router.post('/:id/checkout', async (req, res) => {
  try {
    const { id } = req.params;
    const { finalPayment } = req.body;

    const reservations = await query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (reservations.length === 0) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    const r = reservations[0];
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const assignedRooms = r.assigned_room_numbers ? (typeof r.assigned_room_numbers === 'string' ? JSON.parse(r.assigned_room_numbers) : r.assigned_room_numbers) : [r.room_number];

    // Record final settlement payment if received
    if (finalPayment && finalPayment.amount > 0) {
      const txId = `TXN-${Date.now()}`;
      await query(`
        INSERT INTO transactions (id, reservation_id, guest_name, room_number, amount, type, method, notes, recorded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        txId, id, r.guest_name, r.room_number, finalPayment.amount, 'Payment',
        finalPayment.method || 'Cash', finalPayment.notes || 'Final folio settlement at check-out',
        'Front Desk', nowTime
      ]);
    }

    // Update reservation
    await query(`
      UPDATE reservations SET
        status = 'Checked Out',
        actual_check_out_time = ?,
        balance_amount = 0
      WHERE id = ?
    `, [nowTime, id]);

    // Free rooms and assign Housekeeping cleaning task
    for (const rm of assignedRooms) {
      await query(`
        UPDATE rooms SET
          status = 'Cleaning',
          housekeeping_status = 'Dirty',
          current_guest_id = NULL,
          current_guest_name = NULL,
          current_reservation_id = NULL,
          maintenance_notes = ?
        WHERE room_number = ?
      `, [`Checked out on ${nowTime}`, rm]);

      // Create Housekeeping Task
      const hkId = `HK-${Date.now().toString().slice(-4)}`;
      await query(`
        INSERT INTO housekeeping_tasks (id, room_number, cleaning_status, assigned_staff, priority, task_creation_time, notes)
        VALUES (?, ?, 'Dirty', 'Housekeeping Team', 'High', ?, 'Post check-out thorough sanitation and linen change')
      `, [hkId, rm, nowTime]);
    }

    // Update guest total stays & spend
    await query(`
      UPDATE guests SET
        total_stays = total_stays + 1,
        total_spent = total_spent + ?
      WHERE id = ?
    `, [r.total_amount, r.guest_id]);

    // Activity log
    await query(`
      INSERT INTO activity_logs (id, timestamp, user_name, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `LOG-${Date.now()}`, nowTime, 'Front Desk', 'Guest Check-Out', 'Reservation', id,
      `Guest ${r.guest_name} completed check-out from Room ${assignedRooms.join(', ')}. Room marked for Housekeeping.`
    ]);

    return res.json({
      success: true,
      message: `Check-out completed for ${r.guest_name}. Room ${assignedRooms.join(', ')} marked for cleaning.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update reservation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    if (updates.guestName !== undefined) { fields.push('guest_name = ?'); values.push(updates.guestName); }
    if (updates.guestMobile !== undefined) { fields.push('guest_mobile = ?'); values.push(updates.guestMobile); }
    if (updates.guestEmail !== undefined) { fields.push('guest_email = ?'); values.push(updates.guestEmail); }
    if (updates.roomNumber !== undefined) { fields.push('room_number = ?'); values.push(updates.roomNumber); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.specialRequests !== undefined) { fields.push('special_requests = ?'); values.push(updates.specialRequests); }
    if (updates.ratePerNight !== undefined) { fields.push('rate_per_night = ?'); values.push(updates.ratePerNight); }
    if (updates.totalAmount !== undefined) { fields.push('total_amount = ?'); values.push(updates.totalAmount); }
    if (updates.advancePaid !== undefined) { fields.push('advance_paid = ?'); values.push(updates.advancePaid); }
    if (updates.balanceAmount !== undefined) { fields.push('balance_amount = ?'); values.push(updates.balanceAmount); }

    if (fields.length > 0) {
      values.push(id);
      await query(`UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return res.json({ success: true, message: `Reservation ${id} updated successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
