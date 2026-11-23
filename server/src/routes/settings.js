import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET settings for current tenant
router.get('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    let rows = await query('SELECT * FROM hotel_settings WHERE hotel_id = ? LIMIT 1', [hotelId]);

    if (rows.length === 0) {
      // Auto-create from hotels table if exists
      const hotelRows = await query('SELECT * FROM hotels WHERE id = ?', [hotelId]);
      if (hotelRows.length > 0) {
        const h = hotelRows[0];
        await query(`
          INSERT INTO hotel_settings (
            id, hotel_id, name, tagline, city, state, country, address, phone, email, website, gstin,
            currency, currency_symbol, invoice_prefix
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          `settings_${hotelId}`, hotelId, h.name, h.tagline || 'Hospitality & Luxury',
          h.city, h.state, h.country, h.address, h.phone, h.email, h.website, h.gstin,
          h.currency || 'INR', h.currency_symbol || '₹', (h.code || 'HTL').slice(0, 3) + '-'
        ]);
        rows = await query('SELECT * FROM hotel_settings WHERE hotel_id = ? LIMIT 1', [hotelId]);
      } else {
        return res.status(404).json({ success: false, message: 'Settings not found' });
      }
    }

    const s = rows[0];
    const settings = {
      name: s.name,
      tagline: s.tagline,
      city: s.city,
      state: s.state,
      country: s.country,
      address: s.address,
      phone: s.phone,
      email: s.email,
      website: s.website,
      gstin: s.gstin,
      currency: s.currency,
      currencySymbol: s.currency_symbol,
      checkInTime: s.check_in_time,
      checkOutTime: s.check_out_time,
      timeZone: s.time_zone,
      taxRatePercent: Number(s.tax_rate_percent),
      invoicePrefix: s.invoice_prefix,
      paymentMethods: typeof s.payment_methods === 'string' ? JSON.parse(s.payment_methods) : (s.payment_methods || ['Cash', 'UPI', 'Card', 'Bank Transfer']),
      cancellationPolicy: s.cancellation_policy,
      childCharge: Number(s.child_charge),
      extraGuestCharge: Number(s.extra_guest_charge),
      hotelPolicies: s.hotel_policies,
      logo: s.logo,
    };
    return res.json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE settings for current tenant
router.put('/', async (req, res) => {
  try {
    const hotelId = req.hotelId || 'hotel_ujjain_01';
    const s = req.body;
    await query(`
      UPDATE hotel_settings SET
        name = ?, tagline = ?, city = ?, state = ?, country = ?, address = ?,
        phone = ?, email = ?, website = ?, gstin = ?, currency = ?, currency_symbol = ?,
        check_in_time = ?, check_out_time = ?, time_zone = ?, tax_rate_percent = ?,
        invoice_prefix = ?, payment_methods = ?, cancellation_policy = ?,
        child_charge = ?, extra_guest_charge = ?, hotel_policies = ?, logo = ?
      WHERE hotel_id = ?
    `, [
      s.name, s.tagline, s.city, s.state, s.country, s.address,
      s.phone, s.email, s.website, s.gstin, s.currency, s.currencySymbol,
      s.checkInTime, s.checkOutTime, s.timeZone, s.taxRatePercent,
      s.invoicePrefix, JSON.stringify(s.paymentMethods || []), s.cancellationPolicy,
      s.childCharge, s.extraGuestCharge, s.hotelPolicies, s.logo || null,
      hotelId
    ]);

    // Also update name/city in hotels table
    await query(`UPDATE hotels SET name = ?, city = ? WHERE id = ?`, [s.name, s.city, hotelId]);

    return res.json({ success: true, message: 'Hotel settings updated successfully', settings: s });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
