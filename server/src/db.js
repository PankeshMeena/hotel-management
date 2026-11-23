import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'hotel_pms',
};

let pool = null;

export async function getPool() {
  if (!pool) {
    // 1. Ensure database exists
    const initConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      port: DB_CONFIG.port,
    });

    await initConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await initConn.end();

    // 2. Create the connection pool
    pool = mysql.createPool({
      ...DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      dateStrings: true,
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const p = await getPool();
  const [results] = await p.query(sql, params);
  return results;
}

// Utility: safely ensure column exists in a table
async function ensureColumn(p, table, column, definition) {
  try {
    const [cols] = await p.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [DB_CONFIG.database, table, column]);

    if (cols.length === 0) {
      console.log(`[Migration] Adding column ${table}.${column}...`);
      await p.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition};`);
    }
  } catch (err) {
    console.error(`[Migration Error] failed on ${table}.${column}:`, err.message);
  }
}

export async function initDatabase() {
  const p = await getPool();

  console.log(`[Database] Initializing multi-tenant schema for database: "${DB_CONFIG.database}"...`);

  // 0. Hotels / Tenants Table
  await p.query(`
    CREATE TABLE IF NOT EXISTS hotels (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      tagline VARCHAR(255) NULL,
      city VARCHAR(100) NULL,
      state VARCHAR(100) NULL,
      country VARCHAR(100) DEFAULT 'India',
      address TEXT NULL,
      phone VARCHAR(50) NULL,
      email VARCHAR(100) NULL,
      website VARCHAR(255) NULL,
      gstin VARCHAR(50) NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      currency_symbol VARCHAR(10) DEFAULT '₹',
      status ENUM('Active', 'Inactive', 'Trial') DEFAULT 'Active',
      subscription_plan ENUM('Starter', 'Pro', 'Enterprise') DEFAULT 'Pro',
      logo TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_hotel_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 1. Hotel Settings
  await p.query(`
    CREATE TABLE IF NOT EXISTS hotel_settings (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01',
      name VARCHAR(255) NOT NULL,
      tagline VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100),
      country VARCHAR(100),
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(100),
      website VARCHAR(255),
      gstin VARCHAR(50),
      currency VARCHAR(10) DEFAULT 'INR',
      currency_symbol VARCHAR(10) DEFAULT '₹',
      check_in_time VARCHAR(20) DEFAULT '12:00 PM',
      check_out_time VARCHAR(20) DEFAULT '10:00 AM',
      time_zone VARCHAR(50) DEFAULT 'Asia/Kolkata',
      tax_rate_percent DECIMAL(5,2) DEFAULT 12.00,
      invoice_prefix VARCHAR(20) DEFAULT 'UJS-',
      payment_methods JSON,
      cancellation_policy TEXT,
      child_charge DECIMAL(10,2) DEFAULT 300.00,
      extra_guest_charge DECIMAL(10,2) DEFAULT 500.00,
      hotel_policies TEXT,
      logo TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_settings_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. Users (Superadmin, Owner, Receptionist, Admin)
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NULL DEFAULT 'hotel_ujjain_01',
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) DEFAULT 'Demo@123',
      role ENUM('superadmin', 'owner', 'receptionist', 'admin') NOT NULL DEFAULT 'receptionist',
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_users_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. Room Types
  await p.query(`
    CREATE TABLE IF NOT EXISTS room_types (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01',
      name VARCHAR(100) NOT NULL,
      description TEXT,
      base_price DECIMAL(10,2) NOT NULL,
      max_occupancy INT NOT NULL DEFAULT 2,
      amenities JSON,
      extra_guest_charge DECIMAL(10,2) DEFAULT 400.00,
      is_active BOOLEAN DEFAULT TRUE,
      image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_rt_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 4. Rooms
  await p.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01',
      room_number VARCHAR(20) NOT NULL,
      room_type_id VARCHAR(50) NOT NULL,
      floor INT NOT NULL DEFAULT 1,
      status ENUM('Available', 'Reserved', 'Occupied', 'Cleaning', 'Maintenance', 'Out of Service') NOT NULL DEFAULT 'Available',
      housekeeping_status ENUM('Clean', 'Dirty', 'Cleaning in Progress', 'Inspected') NOT NULL DEFAULT 'Clean',
      current_guest_id VARCHAR(50) NULL,
      current_guest_name VARCHAR(100) NULL,
      current_reservation_id VARCHAR(50) NULL,
      maintenance_notes TEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_room_type (room_type_id),
      INDEX idx_status (status),
      INDEX idx_rooms_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 5. Guests
  await p.query(`
    CREATE TABLE IF NOT EXISTS guests (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01',
      full_name VARCHAR(100) NOT NULL,
      mobile VARCHAR(30) NOT NULL,
      email VARCHAR(100) NULL,
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      country VARCHAR(100) DEFAULT 'India',
      id_document_type VARCHAR(50) DEFAULT 'Aadhaar',
      id_document_number VARCHAR(100),
      id_verification_status ENUM('Verified', 'Pending', 'Rejected') DEFAULT 'Pending',
      id_document_photo LONGTEXT NULL,
      emergency_contact VARCHAR(50) NULL,
      notes TEXT NULL,
      total_stays INT DEFAULT 0,
      total_spent DECIMAL(12,2) DEFAULT 0,
      created_at VARCHAR(50),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_mobile (mobile),
      INDEX idx_guests_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 6. Reservations
  await p.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01',
      guest_id VARCHAR(50) NOT NULL,
      guest_name VARCHAR(100) NOT NULL,
      guest_mobile VARCHAR(30) NOT NULL,
      guest_email VARCHAR(100) NULL,
      room_type_id VARCHAR(50) NOT NULL,
      room_number VARCHAR(20) NOT NULL,
      assigned_room_numbers JSON NULL,
      members JSON NULL,
      adults INT DEFAULT 1,
      children INT DEFAULT 0,
      check_in_date VARCHAR(20) NOT NULL,
      check_out_date VARCHAR(20) NOT NULL,
      number_of_nights INT NOT NULL DEFAULT 1,
      rate_per_night DECIMAL(10,2) NOT NULL,
      discount DECIMAL(10,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      total_amount DECIMAL(10,2) NOT NULL,
      advance_paid DECIMAL(10,2) DEFAULT 0,
      balance_amount DECIMAL(10,2) DEFAULT 0,
      booking_source VARCHAR(50) DEFAULT 'Direct Walk-in',
      status ENUM('Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled', 'No Show') NOT NULL DEFAULT 'Confirmed',
      id_document_photo LONGTEXT NULL,
      actual_check_in_time VARCHAR(50) NULL,
      actual_check_out_time VARCHAR(50) NULL,
      special_requests TEXT NULL,
      cancellation_reason TEXT NULL,
      created_by VARCHAR(100) DEFAULT 'System',
      created_at VARCHAR(50),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_res_status (status),
      INDEX idx_res_dates (check_in_date, check_out_date),
      INDEX idx_res_room (room_number),
      INDEX idx_res_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 7. Transactions
  await p.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01',
      reservation_id VARCHAR(50) NULL,
      guest_name VARCHAR(100) NULL,
      room_number VARCHAR(20) NULL,
      amount DECIMAL(10,2) NOT NULL,
      type ENUM('Advance', 'Payment', 'Refund') NOT NULL,
      method ENUM('Cash', 'UPI', 'Card', 'Bank Transfer') NOT NULL DEFAULT 'Cash',
      reference_no VARCHAR(100) NULL,
      notes TEXT NULL,
      recorded_by VARCHAR(100) DEFAULT 'Front Desk',
      created_at VARCHAR(50),
      INDEX idx_tx_res (reservation_id),
      INDEX idx_tx_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 8. Housekeeping Tasks
  await p.query(`
    CREATE TABLE IF NOT EXISTS housekeeping_tasks (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01',
      room_number VARCHAR(20) NOT NULL,
      cleaning_status ENUM('Clean', 'Dirty', 'Cleaning in Progress', 'Inspected') NOT NULL DEFAULT 'Dirty',
      assigned_staff VARCHAR(100) NOT NULL,
      priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
      task_creation_time VARCHAR(50) NOT NULL,
      completion_time VARCHAR(50) NULL,
      notes TEXT NULL,
      INDEX idx_hk_status (cleaning_status),
      INDEX idx_hk_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 9. Expenses
  await p.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01',
      date VARCHAR(20) NOT NULL,
      category ENUM('Housekeeping', 'Laundry', 'Repairs', 'Electricity', 'Water', 'Supplies', 'Staff', 'Other') NOT NULL,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_method ENUM('Cash', 'UPI', 'Card', 'Bank Transfer') NOT NULL DEFAULT 'Cash',
      vendor VARCHAR(150) NULL,
      recorded_by VARCHAR(100) DEFAULT 'Admin',
      has_receipt BOOLEAN DEFAULT FALSE,
      receipt_photo LONGTEXT NULL,
      created_at VARCHAR(50),
      INDEX idx_expenses_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 10. Staff
  await p.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01',
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NULL,
      mobile VARCHAR(30) NOT NULL,
      role VARCHAR(50) NOT NULL,
      status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
      joining_date VARCHAR(20) NOT NULL,
      avatar TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_staff_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 11. Activity Logs
  await p.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(50) PRIMARY KEY,
      hotel_id VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01',
      timestamp VARCHAR(50) NOT NULL,
      user_name VARCHAR(100) NOT NULL,
      user_role VARCHAR(50) NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      INDEX idx_logs_hotel (hotel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Run dynamic schema migrations to ensure multi-tenancy columns exist on pre-existing tables
  await ensureColumn(p, 'hotel_settings', 'hotel_id', "VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01'");
  await ensureColumn(p, 'users', 'hotel_id', "VARCHAR(50) NULL DEFAULT 'hotel_ujjain_01'");
  await ensureColumn(p, 'rooms', 'hotel_id', "VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01'");
  await ensureColumn(p, 'room_types', 'hotel_id', "VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01'");
  await ensureColumn(p, 'guests', 'hotel_id', "VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01'");
  await ensureColumn(p, 'reservations', 'hotel_id', "VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01'");
  await ensureColumn(p, 'transactions', 'hotel_id', "VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01'");
  await ensureColumn(p, 'housekeeping_tasks', 'hotel_id', "VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01'");
  await ensureColumn(p, 'expenses', 'hotel_id', "VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01'");
  await ensureColumn(p, 'staff', 'hotel_id', "VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01'");
  await ensureColumn(p, 'activity_logs', 'hotel_id', "VARCHAR(50) NOT NULL DEFAULT 'hotel_ujjain_01'");

  // Update role enum in users if needed to support superadmin
  try {
    await p.query(`ALTER TABLE users MODIFY COLUMN role ENUM('superadmin', 'owner', 'receptionist', 'admin') NOT NULL DEFAULT 'receptionist';`);
  } catch (e) {
    // Already modified or compatible
  }

  // Adjust rooms table unique constraint from global room_number to composite (hotel_id, room_number)
  try {
    const [idxRows] = await p.query(`SHOW INDEX FROM rooms WHERE Key_name = 'room_number' AND Non_unique = 0`);
    if (idxRows.length > 0) {
      console.log(`[Migration] Converting rooms.room_number index to multi-tenant composite (hotel_id, room_number)...`);
      await p.query(`ALTER TABLE rooms DROP INDEX room_number;`);
      await p.query(`ALTER TABLE rooms ADD UNIQUE KEY unique_hotel_room (hotel_id, room_number);`);
    }
  } catch (err) {
    // Constraint already updated
  }

  // Seed default tenants and initial data
  await seedTenantsAndData(p);
  console.log(`[Database] All multi-tenant tables and initial seed data are ready!`);
}

export async function seedTenantsAndData(p) {
  // 1. Seed Hotels (Tenants)
  const defaultHotels = [
    {
      id: 'hotel_ujjain_01',
      name: 'UjjainStay Heritage Hotel',
      code: 'UJJAIN01',
      tagline: 'Pilgrimage & Heritage Luxury Stay',
      city: 'Ujjain',
      state: 'Madhya Pradesh',
      country: 'India',
      address: 'Near Mahakaleshwar Temple, Jaisinghpura, Ujjain, MP 456006',
      phone: '+91 98765 43210',
      email: 'info@ujjainstay.com',
      website: 'https://ujjainstay.demo',
      gstin: '23AAAAA0000A1Z5',
      currency: 'INR',
      currency_symbol: '₹',
      status: 'Active',
      subscription_plan: 'Pro',
      logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=150',
    },
    {
      id: 'hotel_shanti_02',
      name: 'Hotel Shanti Palace',
      code: 'SHANTI02',
      tagline: 'Executive Business & Family Suites',
      city: 'Indore',
      state: 'Madhya Pradesh',
      country: 'India',
      address: 'Plot 42, Vijay Nagar, AB Road, Indore, MP 452010',
      phone: '+91 98260 11223',
      email: 'contact@shantipalace.demo',
      website: 'https://shantipalace.demo',
      gstin: '23BBBBB1111B2Z6',
      currency: 'INR',
      currency_symbol: '₹',
      status: 'Active',
      subscription_plan: 'Enterprise',
      logo: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=150',
    },
    {
      id: 'hotel_royal_03',
      name: 'Royal Orchid Resort & Spa',
      code: 'ROYAL03',
      tagline: 'Luxury Heritage Destination',
      city: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      address: 'Amer Road, Opp. Jal Mahal, Jaipur, RJ 302002',
      phone: '+91 94140 88990',
      email: 'reservations@royalorchid.demo',
      website: 'https://royalorchid.demo',
      gstin: '08CCCCC2222C3Z7',
      currency: 'INR',
      currency_symbol: '₹',
      status: 'Trial',
      subscription_plan: 'Starter',
      logo: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=150',
    }
  ];

  for (const h of defaultHotels) {
    await p.query(`
      INSERT INTO hotels (id, name, code, tagline, city, state, country, address, phone, email, website, gstin, currency, currency_symbol, status, subscription_plan, logo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name), city=VALUES(city), status=VALUES(status), subscription_plan=VALUES(subscription_plan)
    `, [
      h.id, h.name, h.code, h.tagline, h.city, h.state, h.country, h.address, h.phone,
      h.email, h.website, h.gstin, h.currency, h.currency_symbol, h.status, h.subscription_plan, h.logo
    ]);
  }

  // 2. Ensure Superadmin user exists
  await p.query(`
    INSERT INTO users (id, hotel_id, name, email, password, role, avatar)
    VALUES ('usr_superadmin', NULL, 'Pankesh Platform Admin', 'superadmin@pms.com', 'Super@123', 'superadmin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
    ON DUPLICATE KEY UPDATE role='superadmin', password='Super@123'
  `);

  // 3. Ensure Hotel 2 Owner exists
  await p.query(`
    INSERT INTO users (id, hotel_id, name, email, password, role, avatar)
    VALUES ('usr_shanti_owner', 'hotel_shanti_02', 'Vikram Sharma', 'owner@shantipalace.demo', 'Owner@123', 'owner', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')
    ON DUPLICATE KEY UPDATE hotel_id='hotel_shanti_02', password='Owner@123'
  `);

  // 4. Ensure Hotel 2 has Settings
  await p.query(`
    INSERT INTO hotel_settings (
      id, hotel_id, name, tagline, city, state, country, address, phone, email, website, gstin,
      currency, currency_symbol, check_in_time, check_out_time, time_zone, tax_rate_percent,
      invoice_prefix, payment_methods, cancellation_policy, child_charge, extra_guest_charge, hotel_policies
    ) VALUES (
      'settings_shanti_02', 'hotel_shanti_02', 'Hotel Shanti Palace', 'Executive Business & Family Suites',
      'Indore', 'Madhya Pradesh', 'India', 'Plot 42, Vijay Nagar, AB Road, Indore, MP 452010',
      '+91 98260 11223', 'contact@shantipalace.demo', 'https://shantipalace.demo', '23BBBBB1111B2Z6',
      'INR', '₹', '02:00 PM', '11:00 AM', 'Asia/Kolkata', 12.00, 'HSP-',
      '["Cash", "UPI", "Card", "Bank Transfer"]', 'Free cancellation up to 24 hours before check-in date.',
      400.00, 700.00, 'Valid government-issued photo ID is required for all adult guests.'
    ) ON DUPLICATE KEY UPDATE name=VALUES(name);
  `);

  // 5. Ensure Hotel 2 has Room Types
  const shantiRoomTypes = [
    { id: 'rt_shanti_exec', name: 'Executive Deluxe Room', basePrice: 3200, maxOccupancy: 2, amenities: ['AC', 'Free High-speed Wi-Fi', 'Smart TV', 'Work Desk', 'Mini Fridge'] },
    { id: 'rt_shanti_suite', name: 'Presidential Luxury Suite', basePrice: 6500, maxOccupancy: 4, amenities: ['King Bed', 'Bathtub', 'Living Area', 'Complimentary Breakfast', 'Butler Service'] }
  ];
  for (const rt of shantiRoomTypes) {
    await p.query(`
      INSERT INTO room_types (id, hotel_id, name, description, base_price, max_occupancy, amenities, extra_guest_charge, is_active)
      VALUES (?, 'hotel_shanti_02', ?, 'Premium comfort room with modern amenities', ?, ?, ?, 600, 1)
      ON DUPLICATE KEY UPDATE base_price=VALUES(base_price)
    `, [rt.id, rt.name, rt.basePrice, rt.maxOccupancy, JSON.stringify(rt.amenities)]);
  }

  // 6. Ensure Hotel 2 has Rooms
  const shantiRooms = [
    { id: 'shanti_101', roomNumber: '101', roomTypeId: 'rt_shanti_exec', floor: 1, status: 'Available' },
    { id: 'shanti_102', roomNumber: '102', roomTypeId: 'rt_shanti_exec', floor: 1, status: 'Occupied', guest: 'Rahul Agrawal' },
    { id: 'shanti_201', roomNumber: '201', roomTypeId: 'rt_shanti_suite', floor: 2, status: 'Available' },
    { id: 'shanti_202', roomNumber: '202', roomTypeId: 'rt_shanti_suite', floor: 2, status: 'Reserved' },
  ];
  for (const rm of shantiRooms) {
    await p.query(`
      INSERT INTO rooms (id, hotel_id, room_number, room_type_id, floor, status, housekeeping_status, current_guest_name)
      VALUES (?, 'hotel_shanti_02', ?, ?, ?, ?, 'Clean', ?)
      ON DUPLICATE KEY UPDATE status=VALUES(status)
    `, [rm.id, rm.roomNumber, rm.roomTypeId, rm.floor, rm.status, rm.guest || null]);
  }

  // 7. Check if seeds.json data needs to be loaded for hotel_ujjain_01
  const [userCount] = await p.query(`SELECT COUNT(*) as count FROM users WHERE email = 'owner@ujjainstay.demo'`);
  if (userCount[0].count === 0) {
    const seedsFile = path.resolve(__dirname, 'seeds.json');
    if (fs.existsSync(seedsFile)) {
      const seeds = JSON.parse(fs.readFileSync(seedsFile, 'utf-8'));

      if (seeds.hotelSettings) {
        const s = seeds.hotelSettings;
        await p.query(`
          INSERT INTO hotel_settings (
            id, hotel_id, name, tagline, city, state, country, address, phone, email, website, gstin,
            currency, currency_symbol, check_in_time, check_out_time, time_zone, tax_rate_percent,
            invoice_prefix, payment_methods, cancellation_policy, child_charge, extra_guest_charge, hotel_policies
          ) VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name=VALUES(name)
        `, [
          'settings_ujjain_01', s.name, s.tagline, s.city, s.state, s.country, s.address, s.phone, s.email, s.website, s.gstin,
          s.currency, s.currencySymbol, s.checkInTime, s.checkOutTime, s.timeZone, s.taxRatePercent,
          s.invoicePrefix, JSON.stringify(s.paymentMethods), s.cancellationPolicy, s.childCharge, s.extraGuestCharge, s.hotelPolicies
        ]);
      }

      if (seeds.users && seeds.users.length) {
        for (const u of seeds.users) {
          const defaultPass = u.email === 'owner@ujjainstay.demo' ? 'Owner@123' : (u.email === 'reception@ujjainstay.demo' ? 'Reception@123' : 'Demo@123');
          await p.query(`
            INSERT INTO users (id, hotel_id, name, email, password, role, avatar)
            VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE role=VALUES(role), password=VALUES(password)
          `, [u.id, u.name, u.email, defaultPass, u.role, u.avatar || null]);
        }
      }

      if (seeds.roomTypes && seeds.roomTypes.length) {
        for (const rt of seeds.roomTypes) {
          await p.query(`
            INSERT INTO room_types (id, hotel_id, name, description, base_price, max_occupancy, amenities, extra_guest_charge, is_active, image)
            VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name)
          `, [
            rt.id, rt.name, rt.description, rt.basePrice, rt.maxOccupancy,
            JSON.stringify(rt.amenities || []), rt.extraGuestCharge || 400, rt.isActive ? 1 : 0, rt.image || null
          ]);
        }
      }

      if (seeds.rooms && seeds.rooms.length) {
        for (const rm of seeds.rooms) {
          await p.query(`
            INSERT INTO rooms (id, hotel_id, room_number, room_type_id, floor, status, housekeeping_status, current_guest_id, current_guest_name, current_reservation_id, maintenance_notes)
            VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status=VALUES(status)
          `, [
            rm.id, rm.roomNumber, rm.roomTypeId, rm.floor, rm.status, rm.housekeepingStatus,
            rm.currentGuestId || null, rm.currentGuestName || null, rm.currentReservationId || null, rm.maintenanceNotes || null
          ]);
        }
      }

      if (seeds.guests && seeds.guests.length) {
        for (const g of seeds.guests) {
          await p.query(`
            INSERT INTO guests (
              id, hotel_id, full_name, mobile, email, address, city, state, country,
              id_document_type, id_document_number, id_verification_status, id_document_photo,
              emergency_contact, notes, total_stays, total_spent, created_at
            ) VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)
          `, [
            g.id, g.fullName, g.mobile, g.email || null, g.address || '', g.city || '', g.state || '', g.country || 'India',
            g.idDocumentType || 'Aadhaar', g.idDocumentNumber || '', g.idVerificationStatus || 'Pending', g.idDocumentPhoto || null,
            g.emergencyContact || null, g.notes || null, g.totalStays || 0, g.totalSpent || 0, g.createdAt || new Date().toISOString().slice(0, 10)
          ]);
        }
      }

      if (seeds.reservations && seeds.reservations.length) {
        for (const r of seeds.reservations) {
          await p.query(`
            INSERT INTO reservations (
              id, hotel_id, guest_id, guest_name, guest_mobile, guest_email, room_type_id, room_number,
              assigned_room_numbers, members, adults, children, check_in_date, check_out_date,
              number_of_nights, rate_per_night, discount, tax_amount, total_amount, advance_paid,
              balance_amount, booking_source, status, id_document_photo, actual_check_in_time,
              actual_check_out_time, special_requests, cancellation_reason, created_by, created_at
            ) VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status=VALUES(status)
          `, [
            r.id, r.guestId, r.guestName, r.guestMobile, r.guestEmail || null, r.roomTypeId, r.roomNumber,
            JSON.stringify(r.assignedRoomNumbers || [r.roomNumber]), JSON.stringify(r.members || []),
            r.adults, r.children, r.checkInDate, r.checkOutDate, r.numberOfNights, r.ratePerNight,
            r.discount || 0, r.taxAmount || 0, r.totalAmount, r.advancePaid || 0, r.balanceAmount || 0,
            r.bookingSource || 'Direct Walk-in', r.status, r.idDocumentPhoto || null, r.actualCheckInTime || null,
            r.actualCheckOutTime || null, r.specialRequests || null, r.cancellationReason || null,
            r.createdBy || 'System', r.createdAt || new Date().toISOString()
          ]);
        }
      }

      if (seeds.transactions && seeds.transactions.length) {
        for (const t of seeds.transactions) {
          await p.query(`
            INSERT INTO transactions (id, hotel_id, reservation_id, guest_name, room_number, amount, type, method, reference_no, notes, recorded_by, created_at)
            VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE amount=VALUES(amount)
          `, [
            t.id, t.reservationId, t.guestName, t.roomNumber, t.amount, t.type, t.paymentMethod,
            t.referenceNo || null, t.notes || null, t.recordedBy || 'Front Desk', t.createdAt
          ]);
        }
      }

      if (seeds.housekeepingTasks && seeds.housekeepingTasks.length) {
        for (const hk of seeds.housekeepingTasks) {
          await p.query(`
            INSERT INTO housekeeping_tasks (id, hotel_id, room_number, cleaning_status, assigned_staff, priority, task_creation_time, completion_time, notes)
            VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE cleaning_status=VALUES(cleaning_status)
          `, [
            hk.id, hk.roomNumber, hk.cleaningStatus, hk.assignedStaff, hk.priority,
            hk.taskCreationTime, hk.completionTime || null, hk.notes || null
          ]);
        }
      }

      if (seeds.expenses && seeds.expenses.length) {
        for (const ex of seeds.expenses) {
          await p.query(`
            INSERT INTO expenses (id, hotel_id, date, category, description, amount, payment_method, vendor, recorded_by, has_receipt, receipt_photo, created_at)
            VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE amount=VALUES(amount)
          `, [
            ex.id, ex.date, ex.category, ex.description, ex.amount, ex.paymentMethod,
            ex.vendor || null, ex.recordedBy || 'Admin', ex.hasReceipt ? 1 : 0, ex.receiptPhoto || null, ex.createdAt
          ]);
        }
      }

      if (seeds.staff && seeds.staff.length) {
        for (const st of seeds.staff) {
          await p.query(`
            INSERT INTO staff (id, hotel_id, name, email, mobile, role, status, joining_date, avatar)
            VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name)
          `, [
            st.id, st.name, st.email || null, st.mobile, st.role, st.status || 'Active',
            st.joiningDate, st.avatar || null
          ]);
        }
      }

      if (seeds.activityLogs && seeds.activityLogs.length) {
        for (const log of seeds.activityLogs) {
          await p.query(`
            INSERT INTO activity_logs (id, hotel_id, timestamp, user_name, user_role, action, entity_type, entity_id, description)
            VALUES (?, 'hotel_ujjain_01', ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE action=VALUES(action)
          `, [
            log.id, log.timestamp, log.userName, log.userRole || null, log.action, log.entityType, log.entityId, log.description
          ]);
        }
      }
    }
  }
}

export const seedIfEmpty = seedTenantsAndData;


