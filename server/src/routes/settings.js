import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET settings
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM hotel_settings LIMIT 1');
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
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
      paymentMethods: typeof s.payment_methods === 'string' ? JSON.parse(s.payment_methods) : s.payment_methods,
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

// UPDATE settings
router.put('/', async (req, res) => {
  try {
    const s = req.body;
    await query(`
      UPDATE hotel_settings SET
        name = ?, tagline = ?, city = ?, state = ?, country = ?, address = ?,
        phone = ?, email = ?, website = ?, gstin = ?, currency = ?, currency_symbol = ?,
        check_in_time = ?, check_out_time = ?, time_zone = ?, tax_rate_percent = ?,
        invoice_prefix = ?, payment_methods = ?, cancellation_policy = ?,
        child_charge = ?, extra_guest_charge = ?, hotel_policies = ?, logo = ?
      WHERE id = 'default'
    `, [
      s.name, s.tagline, s.city, s.state, s.country, s.address,
      s.phone, s.email, s.website, s.gstin, s.currency, s.currencySymbol,
      s.checkInTime, s.checkOutTime, s.timeZone, s.taxRatePercent,
      s.invoicePrefix, JSON.stringify(s.paymentMethods || []), s.cancellationPolicy,
      s.childCharge, s.extraGuestCharge, s.hotelPolicies, s.logo || null
    ]);

    return res.json({ success: true, message: 'Hotel settings updated successfully', settings: s });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
