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

export async function initDatabase() {
  const p = await getPool();

  console.log(`[Database] Initializing schema for database: "${DB_CONFIG.database}"...`);

  // 1. Hotel Settings
  await p.query(`
    CREATE TABLE IF NOT EXISTS hotel_settings (
      id VARCHAR(50) PRIMARY KEY,
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. Users
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) DEFAULT 'Demo@123',
      role ENUM('owner', 'receptionist', 'admin') NOT NULL DEFAULT 'receptionist',
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. Room Types
  await p.query(`
    CREATE TABLE IF NOT EXISTS room_types (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      base_price DECIMAL(10,2) NOT NULL,
      max_occupancy INT NOT NULL DEFAULT 2,
      amenities JSON,
      extra_guest_charge DECIMAL(10,2) DEFAULT 400.00,
      is_active BOOLEAN DEFAULT TRUE,
      image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 4. Rooms
  await p.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id VARCHAR(50) PRIMARY KEY,
      room_number VARCHAR(20) UNIQUE NOT NULL,
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
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 5. Guests
  await p.query(`
    CREATE TABLE IF NOT EXISTS guests (
      id VARCHAR(50) PRIMARY KEY,
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
      INDEX idx_mobile (mobile)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 6. Reservations
  await p.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id VARCHAR(50) PRIMARY KEY,
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
      INDEX idx_res_room (room_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 7. Transactions
  await p.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(50) PRIMARY KEY,
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
      INDEX idx_tx_res (reservation_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 8. Housekeeping Tasks
  await p.query(`
    CREATE TABLE IF NOT EXISTS housekeeping_tasks (
      id VARCHAR(50) PRIMARY KEY,
      room_number VARCHAR(20) NOT NULL,
      cleaning_status ENUM('Clean', 'Dirty', 'Cleaning in Progress', 'Inspected') NOT NULL DEFAULT 'Dirty',
      assigned_staff VARCHAR(100) NOT NULL,
      priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
      task_creation_time VARCHAR(50) NOT NULL,
      completion_time VARCHAR(50) NULL,
      notes TEXT NULL,
      INDEX idx_hk_status (cleaning_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 9. Expenses
  await p.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(50) PRIMARY KEY,
      date VARCHAR(20) NOT NULL,
      category ENUM('Housekeeping', 'Laundry', 'Repairs', 'Electricity', 'Water', 'Supplies', 'Staff', 'Other') NOT NULL,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_method ENUM('Cash', 'UPI', 'Card', 'Bank Transfer') NOT NULL DEFAULT 'Cash',
      vendor VARCHAR(150) NULL,
      recorded_by VARCHAR(100) DEFAULT 'Admin',
      has_receipt BOOLEAN DEFAULT FALSE,
      receipt_photo LONGTEXT NULL,
      created_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 10. Staff
  await p.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NULL,
      mobile VARCHAR(30) NOT NULL,
      role VARCHAR(50) NOT NULL,
      status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
      joining_date VARCHAR(20) NOT NULL,
      avatar TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 11. Activity Logs
  await p.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(50) PRIMARY KEY,
      timestamp VARCHAR(50) NOT NULL,
      user_name VARCHAR(100) NOT NULL,
      user_role VARCHAR(50) NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(50) NOT NULL,
      description TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed data if empty
  await seedIfEmpty(p);
  console.log(`[Database] All tables and seed data ready!`);
}

export async function seedIfEmpty(p) {
  const [userCount] = await p.query(`SELECT COUNT(*) as count FROM users`);
  if (userCount[0].count > 0) {
    return; // Already seeded
  }

  console.log(`[Database] Database is empty. Seeding initial records from seeds.json...`);

  const seedsFile = path.resolve(__dirname, 'seeds.json');
  if (!fs.existsSync(seedsFile)) {
    console.warn(`[Database] Warning: seeds.json not found at ${seedsFile}. Skipping seed.`);
    return;
  }

  const seeds = JSON.parse(fs.readFileSync(seedsFile, 'utf-8'));

  // 1. Hotel Settings
  if (seeds.hotelSettings) {
    const s = seeds.hotelSettings;
    await p.query(`
      INSERT INTO hotel_settings (
        id, name, tagline, city, state, country, address, phone, email, website, gstin,
        currency, currency_symbol, check_in_time, check_out_time, time_zone, tax_rate_percent,
        invoice_prefix, payment_methods, cancellation_policy, child_charge, extra_guest_charge, hotel_policies
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name)
    `, [
      'default', s.name, s.tagline, s.city, s.state, s.country, s.address, s.phone, s.email, s.website, s.gstin,
      s.currency, s.currencySymbol, s.checkInTime, s.checkOutTime, s.timeZone, s.taxRatePercent,
      s.invoicePrefix, JSON.stringify(s.paymentMethods), s.cancellationPolicy, s.childCharge, s.extraGuestCharge, s.hotelPolicies
    ]);
  }

  // 2. Users
  if (seeds.users && seeds.users.length) {
    for (const u of seeds.users) {
      await p.query(`
        INSERT INTO users (id, name, email, password, role, avatar)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [u.id, u.name, u.email, 'Demo@123', u.role, u.avatar || null]);
    }
  }

  // 3. Room Types
  if (seeds.roomTypes && seeds.roomTypes.length) {
    for (const rt of seeds.roomTypes) {
      await p.query(`
        INSERT INTO room_types (id, name, description, base_price, max_occupancy, amenities, extra_guest_charge, is_active, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        rt.id, rt.name, rt.description, rt.basePrice, rt.maxOccupancy,
        JSON.stringify(rt.amenities || []), rt.extraGuestCharge || 400, rt.isActive ? 1 : 0, rt.image || null
      ]);
    }
  }

  // 4. Rooms
  if (seeds.rooms && seeds.rooms.length) {
    for (const rm of seeds.rooms) {
      await p.query(`
        INSERT INTO rooms (id, room_number, room_type_id, floor, status, housekeeping_status, current_guest_id, current_guest_name, current_reservation_id, maintenance_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        rm.id, rm.roomNumber, rm.roomTypeId, rm.floor, rm.status, rm.housekeepingStatus,
        rm.currentGuestId || null, rm.currentGuestName || null, rm.currentReservationId || null, rm.maintenanceNotes || null
      ]);
    }
  }

  // 5. Guests
  if (seeds.guests && seeds.guests.length) {
    for (const g of seeds.guests) {
      await p.query(`
        INSERT INTO guests (
          id, full_name, mobile, email, address, city, state, country,
          id_document_type, id_document_number, id_verification_status, id_document_photo,
          emergency_contact, notes, total_stays, total_spent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        g.id, g.fullName, g.mobile, g.email || null, g.address || '', g.city || '', g.state || '', g.country || 'India',
        g.idDocumentType || 'Aadhaar', g.idDocumentNumber || '', g.idVerificationStatus || 'Pending', g.idDocumentPhoto || null,
        g.emergencyContact || null, g.notes || null, g.totalStays || 0, g.totalSpent || 0, g.createdAt || new Date().toISOString().slice(0, 10)
      ]);
    }
  }

  // 6. Reservations
  if (seeds.reservations && seeds.reservations.length) {
    for (const r of seeds.reservations) {
      await p.query(`
        INSERT INTO reservations (
          id, guest_id, guest_name, guest_mobile, guest_email, room_type_id, room_number,
          assigned_room_numbers, members, adults, children, check_in_date, check_out_date,
          number_of_nights, rate_per_night, discount, tax_amount, total_amount, advance_paid,
          balance_amount, booking_source, status, id_document_photo, actual_check_in_time,
          actual_check_out_time, special_requests, cancellation_reason, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

  // 7. Transactions
  if (seeds.transactions && seeds.transactions.length) {
    for (const t of seeds.transactions) {
      await p.query(`
        INSERT INTO transactions (id, reservation_id, guest_name, room_number, amount, type, method, reference_no, notes, recorded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        t.id, t.reservationId, t.guestName, t.roomNumber, t.amount, t.type, t.paymentMethod,
        t.referenceNo || null, t.notes || null, t.recordedBy || 'Front Desk', t.createdAt
      ]);
    }
  }

  // 8. Housekeeping
  if (seeds.housekeepingTasks && seeds.housekeepingTasks.length) {
    for (const hk of seeds.housekeepingTasks) {
      await p.query(`
        INSERT INTO housekeeping_tasks (id, room_number, cleaning_status, assigned_staff, priority, task_creation_time, completion_time, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        hk.id, hk.roomNumber, hk.cleaningStatus, hk.assignedStaff, hk.priority,
        hk.taskCreationTime, hk.completionTime || null, hk.notes || null
      ]);
    }
  }

  // 9. Expenses
  if (seeds.expenses && seeds.expenses.length) {
    for (const ex of seeds.expenses) {
      await p.query(`
        INSERT INTO expenses (id, date, category, description, amount, payment_method, vendor, recorded_by, has_receipt, receipt_photo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ex.id, ex.date, ex.category, ex.description, ex.amount, ex.paymentMethod,
        ex.vendor || null, ex.recordedBy || 'Admin', ex.hasReceipt ? 1 : 0, ex.receiptPhoto || null, ex.createdAt
      ]);
    }
  }

  // 10. Staff
  if (seeds.staff && seeds.staff.length) {
    for (const st of seeds.staff) {
      await p.query(`
        INSERT INTO staff (id, name, email, mobile, role, status, joining_date, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        st.id, st.name, st.email || null, st.mobile, st.role, st.status || 'Active',
        st.joiningDate, st.avatar || null
      ]);
    }
  }

  // 11. Activity Logs
  if (seeds.activityLogs && seeds.activityLogs.length) {
    for (const log of seeds.activityLogs) {
      await p.query(`
        INSERT INTO activity_logs (id, timestamp, user_name, user_role, action, entity_type, entity_id, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        log.id, log.timestamp, log.userName, log.userRole || null, log.action, log.entityType, log.entityId, log.description
      ]);
    }
  }

  console.log(`[Database] Seeding completed successfully!`);
}
