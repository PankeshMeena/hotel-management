# UjjainStay — Complete Hotel Reception & Management System

**UjjainStay** is a hotel front-desk and property management web application designed specifically for hotel owners, general managers, and front-desk receptionists in Ujjain, Madhya Pradesh (India). It enables seamless management of room inventory, walk-in check-ins, advance reservations, guest identity verification (Form C compliance), itemized GST billing, housekeeping turnarounds, operational expenses, audit logs, and authentic Excel report exports from a single unified dashboard.

---

## 🌟 Key Features Implemented

### 1. Interactive Front-Desk & Walk-in Check-in
- **Walk-in Wizard**: 3-step check-in wizard that validates date range, checks room capacity, searches returning guest phone numbers, records masked government IDs (Aadhaar, Passport, Driving License, Voter ID), collects advance payments, and immediately launches a printable **Official Guest Registration Card**.
- **Desk Operations Board**: Dedicated tabs for Today's Expected Arrivals, In-House Guests, Departures Due, Pending ID Verification, and Pending Balances.
- **Express Check-Out**: Itemized settlement workflow that calculates room nights, applies discounts or additional services, records payment via UPI, Cash, Card, or NEFT, automatically queues a housekeeping task, and produces a printable **GST Tax Invoice**.

### 2. Comprehensive Reservation Management
- **Nightly Overlap Protection**: Strict check on room availability where check-out day is exclusive (`[checkIn, checkOut)`). Prevents double bookings.
- **Search & Filters**: Real-time filtering by status (*Confirmed, Checked In, Checked Out, Pending, Cancelled, No Show*), booking channel (*Direct Walk-in, Website, Phone, Booking.com, MakeMyTrip, Agoda*), and guest phone.
- **Vouchers & Confirmation**: Instant printable Booking Confirmation Vouchers with hotel rules and cancellation policies.

### 3. Visual Room Inventory & Category Rates
- **Dual Presentation**: Interactive visual floor grid (Floor 1: Rooms 101–110, Floor 2: Rooms 201–210, Floor 3: Rooms 301–305) with status indicators and quick-status toggles, alongside a searchable inventory table.
- **Owner Rate Management**: Owner can update base prices (Single Bed ₹999, Double Bed ₹1,499, Deluxe Room ₹2,499), amenities, extra-guest surcharges, and maintenance notes.
- **Conflict Guard**: Prevents deleting rooms that are currently occupied or have upcoming reservations.

### 4. Housekeeping & Maintenance Pipeline
- **4-Stage Board**: Visual columns for *Dirty / Queued*, *In Progress*, *Clean / Review*, and *Inspected & Ready*.
- **Staff Assignment**: Assigns tasks to staff (e.g. Ramu Malviya, Sunita Bai) with priority tags (*Urgent, High, Medium, Low*).
- **Safe Availability Logic**: A room only becomes available once clean/inspected and confirmed free of conflicting reservations.

### 5. Payments, Refunds & GST Billing
- **Payment Ledger**: Tracks Advance deposits, Partial payments, Final settlements, and Additional charges across UPI, Cash, Card, and Bank Transfer.
- **Distinct Refund Handling**: Refunds are logged distinctly as outflow adjustments so they never distort ordinary hotel gross revenue.
- **Tax Invoice Modal**: Formats CGST (6%) and SGST (6%) composite hospitality taxes with GSTIN (`23AAACU1234F1Z5`), guest details, and invoice prefixes (`UJS-`).

### 6. Guest Directory & Ledger Folios
- **Sanitized Directory**: Masks mobile numbers and Aadhaar documents by default.
- **Guest Folio**: Full lifetime view of past stays, total spend, booking records, and transaction receipts with 1-click print.
- **Duplicate Detection**: Warns front-desk operators when registering a phone number that already exists.

### 7. Hotel Operating Expense Tracker
- Tracks operational hotel purchases across 8 categories: *Housekeeping, Laundry, Repairs, Electricity, Water, Supplies, Staff, Other*.
- Visual category breakdowns and net operational cash balance indicators.

### 8. 15 Comprehensive Reports with Real Excel (.xlsx) Export
- Real spreadsheet generation powered by SheetJS (`xlsx`) with column auto-widths and formatted currencies, plus CSV fallback and print layouts:
  1. *Daily Guest Arrival Register (Form C Register)*
  2. *Daily Departure Register*
  3. *Guest In-House Register*
  4. *Guest History & Frequency*
  5. *Room Occupancy Report*
  6. *Room-wise Revenue Report*
  7. *Comprehensive Reservation Report*
  8. *Payment Collection Register*
  9. *Outstanding Payment Ledger*
  10. *Guest Refund Report*
  11. *Operating Expense Report*
  12. *Daily Financial Summary*
  13. *Monthly Financial Summary*
  14. *Cancelled Bookings Report*
  15. *Housekeeping Performance Report*

### 9. Staff Management & Role-Based Access Control
- **Owner / Admin Role**: Unrestricted access to financial settings, room pricing, staff management, and system reset.
- **Receptionist Role**: Access to reservations, walk-in check-in, check-out, housekeeping updates, and guest directory. Restricts access to room pricing, staff creation, and hotel settings.

### 10. Audit Activity Log & Persistence
- Immutable, chronological audit log capturing user actions, timestamps, and entity IDs.
- Persistent demo storage via `localStorage` with a **Reset Demo Data** option to restore initial seed records at any time.

---

## 🔑 Demo Login Credentials

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `owner@ujjainstay.demo` | `Owner@123` | Full access (Rates, Settings, Staff, Reports) |
| **Receptionist** | `reception@ujjainstay.demo` | `Reception@123` | Front-desk operations, Check-in/out, Payments |

> **Quick Fill**: The login page provides 1-click credential auto-fill buttons for both roles. Furthermore, a **Demo Role Switcher** is present in the top-right header menu for instant role testing.

---

## 🛠️ Technology Stack

- **Framework**: React 19 with TypeScript
- **Bundler & Dev Server**: Vite
- **Styling**: Tailwind CSS v4 with custom Plus Jakarta Sans typography and CSS variables
- **Icons**: Lucide React
- **Routing**: React Router v7
- **Charts**: Recharts (Occupancy trend AreaChart, Revenue vs Expenses BarChart)
- **Excel Engine**: SheetJS (`xlsx`) with automatic column width formatting and CSV fallback
- **State & Persistence**: React Context API + LocalStorage data-access layer

---

## 🚀 How to Run the Project Locally

1. **Install Dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Production Build**:
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```
HotelManegment/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── layout/             # Sidebar, Header, Layout wrapper
│   │   ├── modals/             # WalkInModal, NewReservationModal, RegistrationSlipModal, InvoiceModal, BookingConfirmationModal, GuestFolioModal
│   │   └── ui/                 # Toast notifications, Modal, ConfirmDialog, Status Badges
│   ├── context/
│   │   └── HotelContext.tsx    # Reactive state layer, CRUD operations, persistence & dynamic metrics
│   ├── data/
│   │   └── seeds.ts            # Realistic seed records: 25 rooms, 15 guests, 20 reservations, transactions, expenses, staff
│   ├── lib/
│   │   └── utils.ts            # Currency formatters, date overlap calculations, masking, Excel export
│   ├── pages/
│   │   ├── Login.tsx           # Demo login with 1-click persona fills
│   │   ├── Dashboard.tsx       # Live metrics cards, Recharts graphs, arrivals/departures, quick actions
│   │   ├── Reservations.tsx    # Booking management, sorting, filtering, editing, cancellation
│   │   ├── FrontDesk.tsx       # Front-desk workspace, arrival check-in, departure checkout
│   │   ├── Guests.tsx          # Guest directory, duplicate phone check, folios
│   │   ├── Rooms.tsx           # Visual room grid, table view, rate card editor
│   │   ├── Housekeeping.tsx    # 4-stage Kanban cleaning pipeline
│   │   ├── Payments.tsx        # Payment collections, refund ledger, tax invoices
│   │   ├── Expenses.tsx        # Expense tracker by category, net balances
│   │   ├── Reports.tsx         # 15 reports with date filters and SheetJS .xlsx export
│   │   ├── Staff.tsx           # Owner-only staff directory
│   │   ├── Settings.tsx        # Hotel profile, GST rules, invoice prefix, reset demo data
│   │   ├── ActivityLog.tsx     # Chronological audit trail
│   │   └── NotFound.tsx        # 404 page
│   ├── types/
│   │   └── index.ts            # Comprehensive TypeScript interfaces
│   ├── App.tsx                 # Protected route hierarchy
│   ├── main.tsx                # Entry point
│   └── index.css               # Design system tokens and print styles
├── index.html                  # HTML5 boilerplate, Google Fonts, meta tags
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundler setup with path aliases & Tailwind
```

---

## 🔒 Security & Privacy Notice
- All contact numbers and identities in seed data are completely fictional.
- Aadhaar numbers are automatically masked (`•••• •••• 4892`).
- Authentication is client-side for demonstration and rapid stakeholder evaluation. A production deployment should replace the `localStorage` access layer with an authenticated backend REST/GraphQL API, secure HTTP-only cookies, and encrypted document storage.
