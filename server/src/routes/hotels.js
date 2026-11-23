import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all hotels with dynamic stats
router.get('/', async (req, res) => {
  try {
    const hotels = await query(`
      SELECT 
        h.id, h.name, h.code, h.tagline, h.city, h.state, h.country,
        h.address, h.phone, h.email, h.website, h.gstin, h.currency,
        h.currency_symbol as currencySymbol, h.status,
        h.subscription_plan as subscriptionPlan, h.logo, h.created_at as createdAt,
        (SELECT COUNT(*) FROM rooms r WHERE r.hotel_id = h.id) as totalRooms,
        (SELECT COUNT(*) FROM rooms r WHERE r.hotel_id = h.id AND r.status = 'Occupied') as occupiedRooms,
        (SELECT COUNT(*) FROM reservations res WHERE res.hotel_id = h.id AND res.status IN ('Confirmed', 'Checked In')) as activeBookings,
        (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.hotel_id = h.id AND t.type != 'Refund') as totalRevenue
      FROM hotels h
      ORDER BY h.created_at ASC
    `);

    const formattedHotels = hotels.map(h => {
      const total = Number(h.totalRooms) || 0;
      const occupied = Number(h.occupiedRooms) || 0;
      return {
        ...h,
        totalRooms: total,
        occupiedRooms: occupied,
        occupancyPercent: total > 0 ? Math.round((occupied / total) * 100) : 0,
        activeBookings: Number(h.activeBookings) || 0,
        totalRevenue: Number(h.totalRevenue) || 0,
      };
    });

    return res.json({ success: true, hotels: formattedHotels });
  } catch (err) {
    console.error('Error fetching hotels:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET single hotel
router.get('/:id', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }
    const h = rows[0];
    return res.json({
      success: true,
      hotel: {
        id: h.id,
        name: h.name,
        code: h.code,
        tagline: h.tagline,
        city: h.city,
        state: h.state,
        country: h.country,
        address: h.address,
        phone: h.phone,
        email: h.email,
        website: h.website,
        gstin: h.gstin,
        currency: h.currency,
        currencySymbol: h.currency_symbol,
        status: h.status,
        subscriptionPlan: h.subscription_plan,
        logo: h.logo,
        createdAt: h.created_at,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST onboard a new hotel tenant
router.post('/', async (req, res) => {
  try {
    const {
      name,
      code,
      tagline,
      city,
      state,
      country,
      address,
      phone,
      email,
      website,
      gstin,
      subscriptionPlan,
      ownerName,
      ownerEmail,
      ownerPassword,
      roomsCount,
    } = req.body;

    if (!name || !city) {
      return res.status(400).json({ success: false, message: 'Hotel name and city are required.' });
    }

    // Generate unique hotel ID & code
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
    const hotelId = `hotel_${slug}_${Date.now().toString().slice(-4)}`;
    const finalCode = (code || slug.toUpperCase() + '01').slice(0, 10);

    // 1. Insert Hotel
    await query(`
      INSERT INTO hotels (
        id, name, code, tagline, city, state, country, address, phone, email, website, gstin,
        currency, currency_symbol, status, subscription_plan, logo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', '₹', 'Active', ?, ?)
    `, [
      hotelId,
      name.trim(),
      finalCode,
      tagline || 'Experience Comfortable Hospitality',
      city.trim(),
      state || 'Madhya Pradesh',
      country || 'India',
      address || `${city}, India`,
      phone || '+91 90000 00000',
      email || `${slug}@hotel.demo`,
      website || `https://${slug}.demo`,
      gstin || '23AAAAA0000A1Z5',
      subscriptionPlan || 'Pro',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=150',
    ]);

    // 2. Insert Hotel Settings
    await query(`
      INSERT INTO hotel_settings (
        id, hotel_id, name, tagline, city, state, country, address, phone, email, website, gstin,
        currency, currency_symbol, check_in_time, check_out_time, time_zone, tax_rate_percent,
        invoice_prefix, payment_methods, cancellation_policy, child_charge, extra_guest_charge, hotel_policies
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', '₹', '12:00 PM', '11:00 AM', 'Asia/Kolkata', 12.00,
        ?, '["Cash", "UPI", "Card", "Bank Transfer"]', 'Free cancellation 24h before check-in date.',
        300.00, 500.00, 'Valid government photo ID required at check-in.'
      )
    `, [
      `settings_${hotelId}`,
      hotelId,
      name.trim(),
      tagline || 'Comfort & Luxury',
      city.trim(),
      state || 'Madhya Pradesh',
      country || 'India',
      address || `${city}, India`,
      phone || '+91 90000 00000',
      email || `${slug}@hotel.demo`,
      website || `https://${slug}.demo`,
      gstin || '23AAAAA0000A1Z5',
      finalCode.slice(0, 3) + '-',
    ]);

    // 3. Create Default Room Types
    const defaultRoomTypes = [
      { id: `rt_${hotelId}_dlx`, name: 'Deluxe Room', price: 2500, max: 2, amenities: ['AC', 'Free Wi-Fi', 'Smart TV', 'Geyser'] },
      { id: `rt_${hotelId}_super`, name: 'Super Deluxe Room', price: 3800, max: 3, amenities: ['AC', 'High-Speed Wi-Fi', 'King Bed', 'Balcony View', 'Tea/Coffee Maker'] },
      { id: `rt_${hotelId}_suite`, name: 'Executive Suite', price: 6000, max: 4, amenities: ['King Bed', 'Living Area', 'Mini Bar', 'Bathtub', 'Complimentary Breakfast'] },
    ];

    for (const rt of defaultRoomTypes) {
      await query(`
        INSERT INTO room_types (id, hotel_id, name, description, base_price, max_occupancy, amenities, extra_guest_charge, is_active)
        VALUES (?, ?, ?, 'Comfortable spacious room with modern amenities', ?, ?, ?, 500, 1)
      `, [rt.id, hotelId, rt.name, rt.price, rt.max, JSON.stringify(rt.amenities)]);
    }

    // 4. Create Initial Starter Rooms
    const count = Math.min(Math.max(Number(roomsCount) || 8, 4), 30);
    for (let i = 1; i <= count; i++) {
      const floor = Math.floor((i - 1) / 4) + 1;
      const roomNum = `${floor}0${((i - 1) % 4) + 1}`;
      const rtId = i <= 4 ? defaultRoomTypes[0].id : (i <= 8 ? defaultRoomTypes[1].id : defaultRoomTypes[2].id);

      await query(`
        INSERT INTO rooms (id, hotel_id, room_number, room_type_id, floor, status, housekeeping_status)
        VALUES (?, ?, ?, ?, ?, 'Available', 'Clean')
      `, [`${hotelId}_${roomNum}`, hotelId, roomNum, rtId, floor]);
    }

    // 5. Create Hotel Owner User Account
    const finalOwnerEmail = (ownerEmail || `owner@${slug}.demo`).toLowerCase().trim();
    const finalOwnerPassword = ownerPassword || 'Owner@123';
    const finalOwnerName = ownerName || `${name} Manager`;

    await query(`
      INSERT INTO users (id, hotel_id, name, email, password, role, avatar)
      VALUES (?, ?, ?, ?, ?, 'owner', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150')
      ON DUPLICATE KEY UPDATE hotel_id=VALUES(hotel_id), role='owner'
    `, [`usr_${hotelId}_owner`, hotelId, finalOwnerName, finalOwnerEmail, finalOwnerPassword]);

    // 6. Log activity
    await query(`
      INSERT INTO activity_logs (id, hotel_id, timestamp, user_name, user_role, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, 'Platform Admin', 'superadmin', 'Hotel Onboarded', 'Hotel', ?, ?)
    `, [
      `LOG-${Date.now()}`,
      hotelId,
      new Date().toISOString().replace('T', ' ').slice(0, 16),
      hotelId,
      `Successfully onboarded new hotel property: "${name}" in ${city} with ${count} rooms.`
    ]);

    const newHotel = {
      id: hotelId,
      name,
      code: finalCode,
      tagline,
      city,
      state,
      country,
      address,
      phone,
      email,
      website,
      gstin,
      currency: 'INR',
      currencySymbol: '₹',
      status: 'Active',
      subscriptionPlan: subscriptionPlan || 'Pro',
      totalRooms: count,
      occupiedRooms: 0,
      occupancyPercent: 0,
      activeBookings: 0,
      totalRevenue: 0,
    };

    return res.status(201).json({
      success: true,
      message: `Hotel "${name}" successfully onboarded!`,
      hotel: newHotel,
      owner: {
        name: finalOwnerName,
        email: finalOwnerEmail,
        password: finalOwnerPassword,
      }
    });
  } catch (err) {
    console.error('Error onboarding hotel:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update hotel info or subscription
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tagline, city, state, country, address, phone, email, website, gstin, status, subscriptionPlan } = req.body;

    await query(`
      UPDATE hotels 
      SET 
        name = COALESCE(?, name),
        tagline = COALESCE(?, tagline),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        country = COALESCE(?, country),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        website = COALESCE(?, website),
        gstin = COALESCE(?, gstin),
        status = COALESCE(?, status),
        subscription_plan = COALESCE(?, subscription_plan)
      WHERE id = ?
    `, [name, tagline, city, state, country, address, phone, email, website, gstin, status, subscriptionPlan, id]);

    return res.json({ success: true, message: 'Hotel updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST toggle active/inactive status
router.post('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT status FROM hotels WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }
    const current = rows[0].status;
    const nextStatus = current === 'Active' ? 'Inactive' : 'Active';
    await query('UPDATE hotels SET status = ? WHERE id = ?', [nextStatus, id]);
    return res.json({ success: true, message: `Hotel status changed to ${nextStatus}.`, status: nextStatus });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE hotel (soft-delete or permanent)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';

    if (permanent) {
      // Clean up linked tenant records
      await query('DELETE FROM activity_logs WHERE hotel_id = ?', [id]);
      await query('DELETE FROM transactions WHERE hotel_id = ?', [id]);
      await query('DELETE FROM housekeeping_tasks WHERE hotel_id = ?', [id]);
      await query('DELETE FROM expenses WHERE hotel_id = ?', [id]);
      await query('DELETE FROM reservations WHERE hotel_id = ?', [id]);
      await query('DELETE FROM rooms WHERE hotel_id = ?', [id]);
      await query('DELETE FROM room_types WHERE hotel_id = ?', [id]);
      await query('DELETE FROM guests WHERE hotel_id = ?', [id]);
      await query('DELETE FROM staff WHERE hotel_id = ?', [id]);
      await query('DELETE FROM users WHERE hotel_id = ?', [id]);
      await query('DELETE FROM hotel_settings WHERE hotel_id = ?', [id]);
      await query('DELETE FROM hotels WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Hotel permanently deleted from platform.' });
    } else {
      await query(`UPDATE hotels SET status = 'Inactive' WHERE id = ?`, [id]);
      return res.json({ success: true, message: 'Hotel marked as Inactive.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
