export type Role = 'owner' | 'receptionist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export interface HotelSettings {
  name: string;
  tagline: string;
  city: string;
  state: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  currency: string;
  currencySymbol: string;
  checkInTime: string;
  checkOutTime: string;
  timeZone: string;
  taxRatePercent: number;
  invoicePrefix: string;
  paymentMethods: string[];
  cancellationPolicy: string;
  childCharge: number;
  extraGuestCharge: number;
  hotelPolicies: string;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  maxOccupancy: number;
  amenities: string[];
  extraGuestCharge: number;
  isActive: boolean;
  image: string;
}

export type RoomStatus = 'Available' | 'Reserved' | 'Occupied' | 'Cleaning' | 'Maintenance' | 'Out of Service';
export type HousekeepingStatus = 'Dirty' | 'Cleaning in Progress' | 'Clean' | 'Inspected';

export interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  floor: number;
  status: RoomStatus;
  housekeepingStatus: HousekeepingStatus;
  currentGuestId?: string;
  currentGuestName?: string;
  currentReservationId?: string;
  maintenanceNotes?: string;
}

export type IdDocType = 'Aadhaar' | 'Passport' | 'Driving License' | 'Voter ID';
export type VerificationStatus = 'Verified' | 'Pending' | 'Rejected';

export interface Guest {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  idDocumentType: IdDocType;
  idDocumentNumber: string; // Masked Aadhaar by default
  idVerificationStatus: VerificationStatus;
  idDocumentPhoto?: string; // Base64 data URL or photo link of Aadhaar / ID
  emergencyContact?: string;
  notes?: string;
  totalStays: number;
  totalSpent: number;
  createdAt: string;
}

export type ReservationStatus = 'Pending' | 'Confirmed' | 'Checked In' | 'Checked Out' | 'Cancelled' | 'No Show';
export type BookingSource = 'Direct Walk-in' | 'Phone Call' | 'Website' | 'Booking.com' | 'MakeMyTrip' | 'Agoda';

export interface Reservation {
  id: string;
  guestId: string;
  guestName: string;
  guestMobile: string;
  guestEmail?: string;
  roomTypeId: string;
  roomNumber: string;
  adults: number;
  children: number;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  numberOfNights: number;
  ratePerNight: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  bookingSource: BookingSource;
  status: ReservationStatus;
  specialRequests?: string;
  cancellationReason?: string;
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  idDocumentPhoto?: string; // Captured / uploaded ID card photo
  createdBy: string;
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
export type TransactionType = 'Advance' | 'Partial' | 'Final' | 'Refund' | 'Additional Charge';

export interface Transaction {
  id: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  type: TransactionType;
  status: 'Success' | 'Pending' | 'Failed';
  referenceNumber?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  cleaningStatus: HousekeepingStatus;
  assignedStaff: string;
  priority: Priority;
  taskCreationTime: string;
  completionTime?: string;
  notes?: string;
}

export type ExpenseCategory = 'Housekeeping' | 'Laundry' | 'Repairs' | 'Electricity' | 'Water' | 'Supplies' | 'Staff' | 'Other';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  vendor?: string;
  recordedBy: string;
  hasReceipt: boolean;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'Owner' | 'Receptionist' | 'Housekeeping' | 'Manager';
  status: 'Active' | 'Inactive';
  joiningDate: string;
  avatar: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: 'Reservation' | 'Room' | 'Guest' | 'Payment' | 'Expense' | 'Housekeeping' | 'Settings' | 'Staff' | 'Auth';
  entityId: string;
  description: string;
}
