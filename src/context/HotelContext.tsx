import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  User,
  Role,
  HotelSettings,
  RoomType,
  Room,
  Guest,
  Reservation,
  Transaction,
  HousekeepingTask,
  Expense,
  Staff,
  ActivityLog,
} from '../types';
import {
  initialHotelSettings,
  initialUsers,
  initialRoomTypes,
  initialRooms,
  initialGuests,
  initialReservations,
  initialTransactions,
  initialHousekeepingTasks,
  initialExpenses,
  initialStaff,
  initialActivityLogs,
} from '../data/seeds';
import { areDatesOverlapping } from '../lib/utils';

interface HotelContextType {
  // Auth
  currentUser: User | null;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  hasRole: (role: Role) => boolean;

  // State
  hotelSettings: HotelSettings;
  updateHotelSettings: (settings: HotelSettings) => void;
  roomTypes: RoomType[];
  updateRoomType: (id: string, updates: Partial<RoomType>) => void;
  rooms: Room[];
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => { success: boolean; message: string };
  guests: Guest[];
  addGuest: (guest: Omit<Guest, 'id' | 'totalStays' | 'totalSpent' | 'createdAt'>) => Guest;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  reservations: Reservation[];
  createReservation: (resData: Omit<Reservation, 'id' | 'createdAt' | 'createdBy'>) => { success: boolean; message: string; reservation?: Reservation };
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  cancelReservation: (id: string, reason: string) => void;
  checkInReservation: (id: string) => { success: boolean; message: string };
  walkInCheckIn: (payload: {
    guest: Omit<Guest, 'id' | 'totalStays' | 'totalSpent' | 'createdAt'>;
    roomNumber: string;
    roomTypeId: string;
    adults: number;
    children: number;
    checkInDate: string;
    checkOutDate: string;
    ratePerNight: number;
    discount: number;
    advancePaid: number;
    paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
    bookingSource: 'Direct Walk-in';
    specialRequests?: string;
  }) => { success: boolean; message: string; reservation?: Reservation };
  processCheckOut: (reservationId: string, finalPayment?: { amount: number; method: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer'; notes?: string }) => { success: boolean; message: string };
  transactions: Transaction[];
  recordPayment: (payment: Omit<Transaction, 'id' | 'createdAt' | 'recordedBy'>) => void;
  recordRefund: (refund: Omit<Transaction, 'id' | 'createdAt' | 'recordedBy' | 'type'>) => void;
  housekeepingTasks: HousekeepingTask[];
  createHousekeepingTask: (task: Omit<HousekeepingTask, 'id' | 'taskCreationTime'>) => void;
  updateHousekeepingStatus: (taskId: string, status: HousekeepingTask['cleaningStatus']) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'recordedBy'>) => void;
  deleteExpense: (id: string) => void;
  staff: Staff[];
  addStaff: (staffData: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  activityLogs: ActivityLog[];
  addActivityLog: (action: string, entityType: ActivityLog['entityType'], entityId: string, description: string) => void;
  
  // Persistence
  resetDemoData: () => void;

  // Calculated metrics
  metrics: {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    reservedRooms: number;
    cleaningRooms: number;
    maintenanceRooms: number;
    todaysCheckIns: number;
    todaysCheckOuts: number;
    todaysRevenue: number;
    pendingPaymentsTotal: number;
    occupancyPercentage: number;
    inHouseGuestsCount: number;
  };
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'ujjainstay_currentUser',
  SETTINGS: 'ujjainstay_hotelSettings',
  ROOM_TYPES: 'ujjainstay_roomTypes',
  ROOMS: 'ujjainstay_rooms',
  GUESTS: 'ujjainstay_guests',
  RESERVATIONS: 'ujjainstay_reservations',
  TRANSACTIONS: 'ujjainstay_transactions',
  HOUSEKEEPING: 'ujjainstay_housekeeping',
  EXPENSES: 'ujjainstay_expenses',
  STAFF: 'ujjainstay_staff',
  ACTIVITY_LOGS: 'ujjainstay_activityLogs',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return fallback;
  }
}

export const HotelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    loadFromStorage<User | null>(STORAGE_KEYS.USER, initialUsers[0]) // Default logged in as Owner for smooth immediate demo
  );

  const [hotelSettings, setHotelSettings] = useState<HotelSettings>(() =>
    loadFromStorage<HotelSettings>(STORAGE_KEYS.SETTINGS, initialHotelSettings)
  );

  const [roomTypes, setRoomTypes] = useState<RoomType[]>(() =>
    loadFromStorage<RoomType[]>(STORAGE_KEYS.ROOM_TYPES, initialRoomTypes)
  );

  const [rooms, setRooms] = useState<Room[]>(() =>
    loadFromStorage<Room[]>(STORAGE_KEYS.ROOMS, initialRooms)
  );

  const [guests, setGuests] = useState<Guest[]>(() => {
    const loaded = loadFromStorage<Guest[]>(STORAGE_KEYS.GUESTS, initialGuests);
    return loaded.map(g => {
      const seedMatch = initialGuests.find(ig => ig.id === g.id);
      if (!g.idDocumentPhoto && seedMatch?.idDocumentPhoto) {
        return { ...g, idDocumentPhoto: seedMatch.idDocumentPhoto };
      }
      return g;
    });
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const loaded = loadFromStorage<Reservation[]>(STORAGE_KEYS.RESERVATIONS, initialReservations);
    return loaded.map(r => {
      const seedMatch = initialReservations.find(ir => ir.id === r.id);
      if (!r.idDocumentPhoto && seedMatch?.idDocumentPhoto) {
        return { ...r, idDocumentPhoto: seedMatch.idDocumentPhoto };
      }
      return r;
    });
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions)
  );

  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>(() =>
    loadFromStorage<HousekeepingTask[]>(STORAGE_KEYS.HOUSEKEEPING, initialHousekeepingTasks)
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, initialExpenses)
  );

  const [staff, setStaff] = useState<Staff[]>(() =>
    loadFromStorage<Staff[]>(STORAGE_KEYS.STAFF, initialStaff)
  );

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    loadFromStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, initialActivityLogs)
  );

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(hotelSettings));
  }, [hotelSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOM_TYPES, JSON.stringify(roomTypes));
  }, [roomTypes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOUSEKEEPING, JSON.stringify(housekeepingTasks));
  }, [housekeepingTasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  const addActivityLog = (
    action: string,
    entityType: ActivityLog['entityType'],
    entityId: string,
    description: string
  ) => {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').slice(0, 16);
    const newEntry: ActivityLog = {
      id: `ACT-${Date.now().toString().slice(-5)}`,
      timestamp,
      userName: currentUser ? currentUser.name : 'System',
      userRole: currentUser ? (currentUser.role === 'owner' ? 'Owner' : 'Receptionist') : 'System',
      action,
      entityType,
      entityId,
      description,
    };
    setActivityLogs(prev => [newEntry, ...prev]);
  };

  const login = (email: string, pass: string): { success: boolean; message: string } => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'owner@ujjainstay.demo' && pass === 'Owner@123') {
      const ownerUser = initialUsers[0];
      setCurrentUser(ownerUser);
      addActivityLog('User Login', 'Auth', ownerUser.id, `${ownerUser.name} signed in as Owner`);
      return { success: true, message: `Welcome back, ${ownerUser.name}!` };
    }
    if (cleanEmail === 'reception@ujjainstay.demo' && pass === 'Reception@123') {
      const recUser = initialUsers[1];
      setCurrentUser(recUser);
      addActivityLog('User Login', 'Auth', recUser.id, `${recUser.name} signed in as Receptionist`);
      return { success: true, message: `Welcome back, ${recUser.name}!` };
    }
    return { success: false, message: 'Invalid credentials. Please check demo email and password.' };
  };

  const logout = () => {
    if (currentUser) {
      addActivityLog('User Logout', 'Auth', currentUser.id, `${currentUser.name} signed out`);
    }
    setCurrentUser(null);
  };

  const hasRole = (role: Role): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    return currentUser.role === role;
  };

  const updateHotelSettings = (newSettings: HotelSettings) => {
    setHotelSettings(newSettings);
    addActivityLog('Hotel Settings Updated', 'Settings', 'CONFIG', 'General hotel profile and tax rules modified');
  };

  const updateRoomType = (id: string, updates: Partial<RoomType>) => {
    setRoomTypes(prev => prev.map(rt => (rt.id === id ? { ...rt, ...updates } : rt)));
    addActivityLog('Room Type Updated', 'Room', id, `Updated pricing or details for room type ${id}`);
  };

  const addRoom = (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...roomData,
      id: roomData.roomNumber,
    };
    setRooms(prev => [...prev, newRoom].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)));
    addActivityLog('Room Added', 'Room', newRoom.roomNumber, `Added Room ${newRoom.roomNumber} (Floor ${newRoom.floor})`);
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
    addActivityLog('Room Updated', 'Room', id, `Room ${id} details updated`);
  };

  const deleteRoom = (id: string): { success: boolean; message: string } => {
    const target = rooms.find(r => r.id === id);
    if (!target) return { success: false, message: 'Room not found.' };

    if (target.status === 'Occupied') {
      return { success: false, message: `Cannot delete Room ${target.roomNumber} while occupied by guest ${target.currentGuestName || ''}.` };
    }

    const hasActiveReservation = reservations.some(
      r => r.roomNumber === target.roomNumber && (r.status === 'Confirmed' || r.status === 'Pending' || r.status === 'Checked In')
    );
    if (hasActiveReservation) {
      return { success: false, message: `Cannot delete Room ${target.roomNumber} with active or pending reservations.` };
    }

    setRooms(prev => prev.filter(r => r.id !== id));
    addActivityLog('Room Deleted', 'Room', target.roomNumber, `Room ${target.roomNumber} removed from inventory`);
    return { success: true, message: `Room ${target.roomNumber} has been removed successfully.` };
  };

  const addGuest = (guestData: Omit<Guest, 'id' | 'totalStays' | 'totalSpent' | 'createdAt'>): Guest => {
    const newId = `GST-${(guests.length + 1).toString().padStart(3, '0')}`;
    const newGuest: Guest = {
      ...guestData,
      id: newId,
      totalStays: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setGuests(prev => [newGuest, ...prev]);
    addActivityLog('Guest Registered', 'Guest', newId, `Registered guest ${newGuest.fullName} (${newGuest.city})`);
    return newGuest;
  };

  const updateGuest = (id: string, updates: Partial<Guest>) => {
    setGuests(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)));
    addActivityLog('Guest Updated', 'Guest', id, `Guest details updated for ${id}`);
  };

  const createReservation = (
    resData: Omit<Reservation, 'id' | 'createdAt' | 'createdBy'>
  ): { success: boolean; message: string; reservation?: Reservation } => {
    // Overlap validation for all assigned rooms
    const targetRoomNumbers = resData.assignedRoomNumbers && resData.assignedRoomNumbers.length > 0
      ? resData.assignedRoomNumbers
      : [resData.roomNumber];

    let conflictMessage = '';
    const conflicting = reservations.find(r => {
      const rRooms = r.assignedRoomNumbers && r.assignedRoomNumbers.length > 0 ? r.assignedRoomNumbers : [r.roomNumber];
      const overlappingRoom = targetRoomNumbers.find(rm => rRooms.includes(rm));
      if (
        overlappingRoom &&
        (r.status === 'Confirmed' || r.status === 'Checked In' || r.status === 'Pending') &&
        areDatesOverlapping(r.checkInDate, r.checkOutDate, resData.checkInDate, resData.checkOutDate)
      ) {
        conflictMessage = `Room ${overlappingRoom} is already booked for ${r.guestName} between ${r.checkInDate} and ${r.checkOutDate}. Please choose another room.`;
        return true;
      }
      return false;
    });

    if (conflicting) {
      return {
        success: false,
        message: conflictMessage || `One of the selected rooms is already booked. Please choose another room.`,
      };
    }

    const newId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const createdAt = now.toISOString().replace('T', ' ').slice(0, 16);

    const newReservation: Reservation = {
      ...resData,
      id: newId,
      createdAt,
      createdBy: currentUser ? currentUser.name : 'Front Desk',
    };

    setReservations(prev => [newReservation, ...prev]);

    // Update room status if arrival is today and status is confirmed/pending
    const todayStr = '2026-10-14'; // Reference today
    if (resData.checkInDate === todayStr) {
      const assigned = resData.assignedRoomNumbers && resData.assignedRoomNumbers.length > 0
        ? resData.assignedRoomNumbers
        : [resData.roomNumber];

      setRooms(prev =>
        prev.map(r =>
          assigned.includes(r.roomNumber)
            ? { ...r, status: 'Reserved', currentGuestName: resData.guestName, currentReservationId: newId }
            : r
        )
      );
    }

    // Record advance payment transaction if any
    if (resData.advancePaid > 0) {
      const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTxn: Transaction = {
        id: txnId,
        reservationId: newId,
        guestId: resData.guestId,
        guestName: resData.guestName,
        amount: resData.advancePaid,
        paymentMethod: 'UPI',
        type: resData.advancePaid >= resData.totalAmount ? 'Final' : 'Advance',
        status: 'Success',
        recordedBy: currentUser ? currentUser.name : 'Front Desk',
        notes: `Advance payment for Reservation ${newId}`,
        createdAt,
      };
      setTransactions(prev => [newTxn, ...prev]);
    }

    addActivityLog('Reservation Created', 'Reservation', newId, `Booked Room ${resData.roomNumber} for ${resData.guestName} (${resData.numberOfNights} nights)`);
    return { success: true, message: `Reservation ${newId} confirmed successfully.`, reservation: newReservation };
  };

  const updateReservation = (id: string, updates: Partial<Reservation>) => {
    setReservations(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
    addActivityLog('Reservation Modified', 'Reservation', id, `Updated reservation ${id}`);
  };

  const cancelReservation = (id: string, reason: string) => {
    const target = reservations.find(r => r.id === id);
    if (!target) return;

    setReservations(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'Cancelled', cancellationReason: reason } : r))
    );

    // Free the room if it was reserved
    setRooms(prev =>
      prev.map(r =>
        r.roomNumber === target.roomNumber && r.status === 'Reserved'
          ? { ...r, status: 'Available', currentGuestName: undefined, currentReservationId: undefined }
          : r
      )
    );

    addActivityLog('Reservation Cancelled', 'Reservation', id, `Cancelled booking for ${target.guestName}: ${reason}`);
  };

  const checkInReservation = (id: string): { success: boolean; message: string } => {
    const target = reservations.find(r => r.id === id);
    if (!target) return { success: false, message: 'Reservation not found.' };

    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').slice(0, 16);

    setReservations(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'Checked In', actualCheckInTime: timestamp } : r))
    );

    setRooms(prev =>
      prev.map(r =>
        r.roomNumber === target.roomNumber
          ? {
              ...r,
              status: 'Occupied',
              currentGuestId: target.guestId,
              currentGuestName: target.guestName,
              currentReservationId: target.id,
            }
          : r
      )
    );

    addActivityLog('Guest Checked In', 'Reservation', id, `${target.guestName} checked in to Room ${target.roomNumber}`);
    return { success: true, message: `${target.guestName} checked into Room ${target.roomNumber} successfully!` };
  };

  const walkInCheckIn = (payload: {
    guest: Omit<Guest, 'id' | 'totalStays' | 'totalSpent' | 'createdAt'>;
    roomNumber: string;
    roomTypeId: string;
    adults: number;
    children: number;
    checkInDate: string;
    checkOutDate: string;
    ratePerNight: number;
    discount: number;
    advancePaid: number;
    paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
    bookingSource: 'Direct Walk-in';
    specialRequests?: string;
  }): { success: boolean; message: string; reservation?: Reservation } => {
    // 1. Date logic check
    if (new Date(payload.checkOutDate) <= new Date(payload.checkInDate)) {
      return { success: false, message: 'Departure date must be after arrival date.' };
    }

    // 2. Capacity check
    const roomType = roomTypes.find(rt => rt.id === payload.roomTypeId);
    if (roomType && payload.adults > roomType.maxOccupancy) {
      return {
        success: false,
        message: `Selected room capacity (${roomType.maxOccupancy}) is exceeded by guest count (${payload.adults}).`,
      };
    }

    // 3. Room conflict check
    const conflicting = reservations.find(
      r =>
        r.roomNumber === payload.roomNumber &&
        (r.status === 'Confirmed' || r.status === 'Checked In' || r.status === 'Pending') &&
        areDatesOverlapping(r.checkInDate, r.checkOutDate, payload.checkInDate, payload.checkOutDate)
    );

    if (conflicting) {
      return {
        success: false,
        message: `Room ${payload.roomNumber} is occupied or reserved for those dates by ${conflicting.guestName}.`,
      };
    }

    // 4. Find or create guest
    let guestId: string;
    const existingGuest = guests.find(g => g.mobile.replace(/\s+/g, '') === payload.guest.mobile.replace(/\s+/g, ''));
    if (existingGuest) {
      guestId = existingGuest.id;
      // Update verification status or notes if provided
      updateGuest(existingGuest.id, {
        idDocumentType: payload.guest.idDocumentType,
        idDocumentNumber: payload.guest.idDocumentNumber,
        idVerificationStatus: payload.guest.idVerificationStatus,
        idDocumentPhoto: payload.guest.idDocumentPhoto || existingGuest.idDocumentPhoto,
      });
    } else {
      const createdGuest = addGuest(payload.guest);
      guestId = createdGuest.id;
    }

    // 5. Calculate financials
    const nights = Math.max(1, Math.ceil((new Date(payload.checkOutDate).getTime() - new Date(payload.checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
    const baseTotal = nights * payload.ratePerNight - payload.discount;
    const taxAmount = Math.round(baseTotal * (hotelSettings.taxRatePercent / 100));
    const totalAmount = baseTotal + taxAmount;
    const balanceAmount = Math.max(0, totalAmount - payload.advancePaid);

    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').slice(0, 16);
    const newReservationId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRes: Reservation = {
      id: newReservationId,
      guestId,
      guestName: payload.guest.fullName,
      guestMobile: payload.guest.mobile,
      guestEmail: payload.guest.email,
      roomTypeId: payload.roomTypeId,
      roomNumber: payload.roomNumber,
      adults: payload.adults,
      children: payload.children,
      checkInDate: payload.checkInDate,
      checkOutDate: payload.checkOutDate,
      numberOfNights: nights,
      ratePerNight: payload.ratePerNight,
      discount: payload.discount,
      taxAmount,
      totalAmount,
      advancePaid: payload.advancePaid,
      balanceAmount,
      bookingSource: payload.bookingSource,
      status: 'Checked In',
      actualCheckInTime: timestamp,
      specialRequests: payload.specialRequests,
      idDocumentPhoto: payload.guest.idDocumentPhoto,
      createdBy: currentUser ? currentUser.name : 'Front Desk',
      createdAt: timestamp,
    };

    setReservations(prev => [newRes, ...prev]);

    // 6. Update room to Occupied
    setRooms(prev =>
      prev.map(r =>
        r.roomNumber === payload.roomNumber
          ? {
              ...r,
              status: 'Occupied',
              housekeepingStatus: 'Clean',
              currentGuestId: guestId,
              currentGuestName: payload.guest.fullName,
              currentReservationId: newReservationId,
            }
          : r
      )
    );

    // 7. Record transaction if payment provided
    if (payload.advancePaid > 0) {
      const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
      const txn: Transaction = {
        id: txnId,
        reservationId: newReservationId,
        guestId,
        guestName: payload.guest.fullName,
        amount: payload.advancePaid,
        paymentMethod: payload.paymentMethod,
        type: payload.advancePaid >= totalAmount ? 'Final' : 'Advance',
        status: 'Success',
        recordedBy: currentUser ? currentUser.name : 'Front Desk',
        notes: `Walk-in check-in payment for Room ${payload.roomNumber}`,
        createdAt: timestamp,
      };
      setTransactions(prev => [txn, ...prev]);
    }

    addActivityLog('Walk-in Check-in', 'Reservation', newReservationId, `${payload.guest.fullName} checked in directly to Room ${payload.roomNumber}`);
    return { success: true, message: `Walk-in check-in completed for ${payload.guest.fullName} in Room ${payload.roomNumber}!`, reservation: newRes };
  };

  const processCheckOut = (
    reservationId: string,
    finalPayment?: { amount: number; method: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer'; notes?: string }
  ): { success: boolean; message: string } => {
    const res = reservations.find(r => r.id === reservationId);
    if (!res) return { success: false, message: 'Reservation not found.' };

    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').slice(0, 16);

    let updatedAdvance = res.advancePaid;
    let updatedBalance = res.balanceAmount;

    if (finalPayment && finalPayment.amount > 0) {
      const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
      const txn: Transaction = {
        id: txnId,
        reservationId,
        guestId: res.guestId,
        guestName: res.guestName,
        amount: finalPayment.amount,
        paymentMethod: finalPayment.method,
        type: 'Final',
        status: 'Success',
        recordedBy: currentUser ? currentUser.name : 'Front Desk',
        notes: finalPayment.notes || `Settlement at checkout for Room ${res.roomNumber}`,
        createdAt: timestamp,
      };
      setTransactions(prev => [txn, ...prev]);
      updatedAdvance += finalPayment.amount;
      updatedBalance = Math.max(0, updatedBalance - finalPayment.amount);
    }

    // Update reservation
    setReservations(prev =>
      prev.map(r =>
        r.id === reservationId
          ? {
              ...r,
              status: 'Checked Out',
              actualCheckOutTime: timestamp,
              advancePaid: updatedAdvance,
              balanceAmount: updatedBalance,
            }
          : r
      )
    );

    // Update room to Cleaning
    setRooms(prev =>
      prev.map(r =>
        r.roomNumber === res.roomNumber
          ? {
              ...r,
              status: 'Cleaning',
              housekeepingStatus: 'Dirty',
              currentGuestId: undefined,
              currentGuestName: undefined,
              currentReservationId: undefined,
            }
          : r
      )
    );

    // Queue housekeeping task
    const hkId = `HK-${Date.now().toString().slice(-4)}`;
    const newHkTask: HousekeepingTask = {
      id: hkId,
      roomNumber: res.roomNumber,
      cleaningStatus: 'Dirty',
      assignedStaff: 'Ramu Malviya',
      priority: 'High',
      taskCreationTime: timestamp,
      notes: `Post checkout deep cleaning for Room ${res.roomNumber} (${res.guestName})`,
    };
    setHousekeepingTasks(prev => [newHkTask, ...prev]);

    // Update guest total stays and spent
    setGuests(prev =>
      prev.map(g =>
        g.id === res.guestId
          ? {
              ...g,
              totalStays: g.totalStays + 1,
              totalSpent: g.totalSpent + res.totalAmount,
            }
          : g
      )
    );

    addActivityLog('Guest Checked Out', 'Reservation', reservationId, `${res.guestName} checked out of Room ${res.roomNumber}. Room marked for Cleaning.`);
    return { success: true, message: `Check-out completed for ${res.guestName}. Room ${res.roomNumber} queued for cleaning.` };
  };

  const recordPayment = (payment: Omit<Transaction, 'id' | 'createdAt' | 'recordedBy'>) => {
    const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const createdAt = now.toISOString().replace('T', ' ').slice(0, 16);

    const newTxn: Transaction = {
      ...payment,
      id: txnId,
      createdAt,
      recordedBy: currentUser ? currentUser.name : 'Front Desk',
    };

    setTransactions(prev => [newTxn, ...prev]);

    // Update reservation balance if linked
    if (payment.reservationId) {
      setReservations(prev =>
        prev.map(r => {
          if (r.id === payment.reservationId) {
            const newPaid = r.advancePaid + payment.amount;
            const newBal = Math.max(0, r.totalAmount - newPaid);
            return { ...r, advancePaid: newPaid, balanceAmount: newBal };
          }
          return r;
        })
      );
    }

    addActivityLog('Payment Recorded', 'Payment', txnId, `Received ${hotelSettings.currencySymbol}${payment.amount} via ${payment.paymentMethod} from ${payment.guestName}`);
  };

  const recordRefund = (refund: Omit<Transaction, 'id' | 'createdAt' | 'recordedBy' | 'type'>) => {
    const txnId = `REF-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const createdAt = now.toISOString().replace('T', ' ').slice(0, 16);

    const newTxn: Transaction = {
      ...refund,
      id: txnId,
      type: 'Refund',
      createdAt,
      recordedBy: currentUser ? currentUser.name : 'Management',
    };

    setTransactions(prev => [newTxn, ...prev]);

    // Note: Refunds are tracked distinctly and do not inflate ordinary revenue
    addActivityLog('Refund Issued', 'Payment', txnId, `Issued refund of ${hotelSettings.currencySymbol}${refund.amount} to ${refund.guestName}`);
  };

  const createHousekeepingTask = (task: Omit<HousekeepingTask, 'id' | 'taskCreationTime'>) => {
    const newId = `HK-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const taskCreationTime = now.toISOString().replace('T', ' ').slice(0, 16);

    const newTask: HousekeepingTask = {
      ...task,
      id: newId,
      taskCreationTime,
    };

    setHousekeepingTasks(prev => [newTask, ...prev]);
    // Sync room housekeeping status
    setRooms(prev =>
      prev.map(r => (r.roomNumber === task.roomNumber ? { ...r, housekeepingStatus: task.cleaningStatus } : r))
    );

    addActivityLog('Housekeeping Task Created', 'Housekeeping', newId, `Task created for Room ${task.roomNumber}`);
  };

  const updateHousekeepingStatus = (taskId: string, status: HousekeepingTask['cleaningStatus']) => {
    const target = housekeepingTasks.find(t => t.id === taskId);
    if (!target) return;

    const now = new Date();
    const completionTime = status === 'Clean' || status === 'Inspected' ? now.toISOString().replace('T', ' ').slice(0, 16) : undefined;

    setHousekeepingTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, cleaningStatus: status, completionTime: completionTime || t.completionTime } : t))
    );

    // Sync room status
    setRooms(prev =>
      prev.map(r => {
        if (r.roomNumber === target.roomNumber) {
          let newRoomStatus = r.status;
          // If room was 'Cleaning' and is now Clean/Inspected, only make it Available if not currently occupied or reserved
          if (r.status === 'Cleaning' && (status === 'Clean' || status === 'Inspected')) {
            newRoomStatus = 'Available';
          }
          return { ...r, housekeepingStatus: status, status: newRoomStatus };
        }
        return r;
      })
    );

    addActivityLog('Housekeeping Updated', 'Housekeeping', taskId, `Room ${target.roomNumber} status set to ${status}`);
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt' | 'recordedBy'>) => {
    const id = `EXP-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const createdAt = now.toISOString().replace('T', ' ').slice(0, 16);

    const newExpense: Expense = {
      ...expense,
      id,
      createdAt,
      recordedBy: currentUser ? currentUser.name : 'Management',
    };

    setExpenses(prev => [newExpense, ...prev]);
    addActivityLog('Expense Recorded', 'Expense', id, `Added ${expense.category} expense of ${hotelSettings.currencySymbol}${expense.amount}`);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    addActivityLog('Expense Deleted', 'Expense', id, `Removed expense entry ${id}`);
  };

  const addStaff = (staffData: Omit<Staff, 'id'>) => {
    const id = `STF-${(staff.length + 1).toString().padStart(2, '0')}`;
    const newStaff: Staff = { ...staffData, id };
    setStaff(prev => [...prev, newStaff]);
    addActivityLog('Staff Member Added', 'Staff', id, `Added ${newStaff.name} (${newStaff.role})`);
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    setStaff(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    addActivityLog('Staff Member Updated', 'Staff', id, `Updated staff profile for ${id}`);
  };

  const resetDemoData = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    setHotelSettings(initialHotelSettings);
    setRoomTypes(initialRoomTypes);
    setRooms(initialRooms);
    setGuests(initialGuests);
    setReservations(initialReservations);
    setTransactions(initialTransactions);
    setHousekeepingTasks(initialHousekeepingTasks);
    setExpenses(initialExpenses);
    setStaff(initialStaff);
    setActivityLogs(initialActivityLogs);
    setCurrentUser(initialUsers[0]);
  };

  // Recalculate metrics dynamically based on active data
  const metrics = useMemo(() => {
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.status === 'Available').length;
    const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
    const reservedRooms = rooms.filter(r => r.status === 'Reserved').length;
    const cleaningRooms = rooms.filter(r => r.status === 'Cleaning').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance' || r.status === 'Out of Service').length;

    const todayStr = '2026-10-14';

    const todaysCheckIns = reservations.filter(
      r => r.checkInDate === todayStr && (r.status === 'Checked In' || r.status === 'Confirmed' || r.status === 'Pending')
    ).length;

    const todaysCheckOuts = reservations.filter(
      r => r.checkOutDate === todayStr && (r.status === 'Checked In' || r.status === 'Checked Out')
    ).length;

    // Today's revenue: payments received on today's date minus refunds
    const todaysTxns = transactions.filter(t => t.createdAt.startsWith(todayStr) && t.status === 'Success');
    const todaysPayments = todaysTxns.filter(t => t.type !== 'Refund').reduce((sum, t) => sum + t.amount, 0);
    const todaysRefunds = todaysTxns.filter(t => t.type === 'Refund').reduce((sum, t) => sum + t.amount, 0);
    const todaysRevenue = todaysPayments - todaysRefunds;

    // Outstanding balance on active in-house and confirmed reservations
    const pendingPaymentsTotal = reservations
      .filter(r => r.status === 'Checked In' || r.status === 'Confirmed')
      .reduce((sum, r) => sum + r.balanceAmount, 0);

    const occupancyPercentage = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const inHouseGuestsCount = reservations.filter(r => r.status === 'Checked In').reduce((sum, r) => sum + r.adults + r.children, 0);

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      reservedRooms,
      cleaningRooms,
      maintenanceRooms,
      todaysCheckIns,
      todaysCheckOuts,
      todaysRevenue,
      pendingPaymentsTotal,
      occupancyPercentage,
      inHouseGuestsCount,
    };
  }, [rooms, reservations, transactions]);

  return (
    <HotelContext.Provider
      value={{
        currentUser,
        login,
        logout,
        hasRole,
        hotelSettings,
        updateHotelSettings,
        roomTypes,
        updateRoomType,
        rooms,
        addRoom,
        updateRoom,
        deleteRoom,
        guests,
        addGuest,
        updateGuest,
        reservations,
        createReservation,
        updateReservation,
        cancelReservation,
        checkInReservation,
        walkInCheckIn,
        processCheckOut,
        transactions,
        recordPayment,
        recordRefund,
        housekeepingTasks,
        createHousekeepingTask,
        updateHousekeepingStatus,
        expenses,
        addExpense,
        deleteExpense,
        staff,
        addStaff,
        updateStaff,
        activityLogs,
        addActivityLog,
        resetDemoData,
        metrics,
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};
