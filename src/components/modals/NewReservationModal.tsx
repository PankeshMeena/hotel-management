import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHotel } from '../../context/HotelContext';
import { useToast } from '../ui/Toast';
import { BookingSource, Reservation, IdDocType, ReservationMember, AllocatedRoom } from '../../types';
import { formatCurrency, calculateNights } from '../../lib/utils';
import {
  Calendar,
  User,
  Phone,
  CheckCircle2,
  Plus,
  Trash2,
  BedDouble,
  Users,
  ShieldCheck,
  CreditCard,
  MapPin,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeInfo,
} from 'lucide-react';
import { BookingConfirmationModal } from './BookingConfirmationModal';
import { IdPhotoUploader } from '../ui/IdPhotoUploader';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoomSelectionRow {
  id: string;
  roomTypeId: string;
  roomNumber: string;
  ratePerNight: number;
}

interface MemberFormState {
  id: string;
  name: string;
  surname: string;
  age: string | number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  address: string;
  idDocumentType: IdDocType;
  idDocumentNumber: string;
  idDocumentPhoto: string;
  isPrimary: boolean;
}

export const NewReservationModal: React.FC<NewReservationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { rooms, roomTypes, hotelSettings, createReservation, guests, addGuest } = useHotel();
  const { success, error, warning } = useToast();

  const todayStr = '2026-10-14';
  const tomorrowStr = '2026-10-15';

  // Stay Dates & Booking Details
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [bookingSource, setBookingSource] = useState<BookingSource>('Direct Walk-in');
  const [guestEmail, setGuestEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [advancePaid, setAdvancePaid] = useState<number>(500);

  // Multi-Room Selection State (e.g. 2 Single Beds + 1 Double Bed)
  const defaultRoomType = roomTypes[0] || { id: 'single', basePrice: 999 };
  const [roomsToBook, setRoomsToBook] = useState<RoomSelectionRow[]>([
    {
      id: 'room-1',
      roomTypeId: defaultRoomType.id,
      roomNumber: '',
      ratePerNight: defaultRoomType.basePrice,
    },
  ]);

  // Multiple Members State (e.g. 4 members with details and ID uploads)
  const [members, setMembers] = useState<MemberFormState[]>([
    {
      id: 'member-1',
      name: '',
      surname: '',
      age: '',
      gender: 'Male',
      mobile: '',
      address: '',
      idDocumentType: 'Aadhaar',
      idDocumentNumber: '',
      idDocumentPhoto: '',
      isPrimary: true,
    },
  ]);

  // Expanded member state for accordion-like ease of use
  const [expandedMemberId, setExpandedMemberId] = useState<string>('member-1');

  // Modal for confirmation voucher
  const [confirmedBooking, setConfirmedBooking] = useState<Reservation | null>(null);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  // Nights calculation
  const nights = calculateNights(checkInDate, checkOutDate);

  // Total nightly rate of all allocated rooms
  const totalRoomNightlyRate = roomsToBook.reduce((acc, row) => acc + (row.ratePerNight || 0), 0);
  const subtotal = nights * totalRoomNightlyRate;
  const taxAmount = Math.round(subtotal * (hotelSettings.taxRatePercent / 100));
  const totalAmount = subtotal + taxAmount;
  const balanceAmount = Math.max(0, totalAmount - advancePaid);

  // Handlers for Room Rows
  const handleAddRoomRow = () => {
    const nextType = roomTypes[0] || { id: 'single', basePrice: 999 };
    setRoomsToBook(prev => [
      ...prev,
      {
        id: `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        roomTypeId: nextType.id,
        roomNumber: '',
        ratePerNight: nextType.basePrice,
      },
    ]);
  };

  const handleRemoveRoomRow = (id: string) => {
    if (roomsToBook.length <= 1) return;
    setRoomsToBook(prev => prev.filter(r => r.id !== id));
  };

  const handleRoomTypeChange = (id: string, newTypeId: string) => {
    const rt = roomTypes.find(t => t.id === newTypeId);
    setRoomsToBook(prev =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            roomTypeId: newTypeId,
            roomNumber: '',
            ratePerNight: rt ? rt.basePrice : 999,
          };
        }
        return r;
      })
    );
  };

  const handleRoomNumberChange = (id: string, newRoomNumber: string) => {
    setRoomsToBook(prev =>
      prev.map(r => (r.id === id ? { ...r, roomNumber: newRoomNumber } : r))
    );
  };

  // Handlers for Members
  const handleAddMember = () => {
    const newId = `member-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const primaryAddress = members[0]?.address || '';
    setMembers(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        surname: '',
        age: '',
        gender: 'Male',
        mobile: '',
        address: primaryAddress,
        idDocumentType: 'Aadhaar',
        idDocumentNumber: '',
        idDocumentPhoto: '',
        isPrimary: false,
      },
    ]);
    setExpandedMemberId(newId);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers(prev => prev.filter(m => m.id !== id));
    if (expandedMemberId === id) {
      setExpandedMemberId(members[0]?.id || '');
    }
  };

  const handleMemberChange = (id: string, field: keyof MemberFormState, value: any) => {
    setMembers(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const primaryMember = members[0];
    if (!primaryMember || !primaryMember.name.trim()) {
      error('Primary guest first name is required.');
      return;
    }

    if (!primaryMember.mobile.trim()) {
      error('Primary guest mobile number is required.');
      return;
    }

    // Check all rooms are assigned
    const unassignedRooms = roomsToBook.some(r => !r.roomNumber);
    if (unassignedRooms) {
      error('Please select a room number for all allocated room slots.');
      return;
    }

    // Check duplicate room numbers within the booking
    const selectedRoomNums = roomsToBook.map(r => r.roomNumber);
    const hasDuplicates = new Set(selectedRoomNums).size !== selectedRoomNums.length;
    if (hasDuplicates) {
      error('You have selected the same room number more than once. Please choose distinct rooms.');
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      error('Check-out date must be after check-in date.');
      return;
    }

    // Full name of primary guest
    const primaryFullName = `${primaryMember.name.trim()} ${primaryMember.surname.trim()}`.trim();

    // Check if guest exists in directory or create
    let targetGuestId = 'GST-NEW';
    const cleanMobile = primaryMember.mobile.replace(/\s+/g, '');
    const existingGuest = guests.find(g => g.mobile.replace(/\s+/g, '') === cleanMobile);
    
    if (existingGuest) {
      targetGuestId = existingGuest.id;
    } else {
      const createdGuest = addGuest({
        fullName: primaryFullName,
        mobile: primaryMember.mobile.trim(),
        email: guestEmail.trim() || undefined,
        address: primaryMember.address.trim() || 'Direct Reservation',
        city: 'Local',
        state: 'State',
        country: 'India',
        idDocumentType: primaryMember.idDocumentType,
        idDocumentNumber: primaryMember.idDocumentNumber || '•••• •••• 9999',
        idVerificationStatus: primaryMember.idDocumentPhoto ? 'Verified' : 'Pending',
        idDocumentPhoto: primaryMember.idDocumentPhoto || undefined,
      });
      targetGuestId = createdGuest.id;
    }

    // Build reservation members list
    const reservationMembers: ReservationMember[] = members.map((m, idx) => ({
      id: m.id,
      name: m.name.trim(),
      surname: m.surname.trim(),
      age: m.age ? Number(m.age) : undefined,
      gender: m.gender,
      mobile: m.mobile.trim(),
      address: m.address.trim(),
      idDocumentType: m.idDocumentType,
      idDocumentNumber: m.idDocumentNumber.trim(),
      idDocumentPhoto: m.idDocumentPhoto || undefined,
      isPrimary: idx === 0,
    }));

    // Build allocated rooms
    const allocatedRoomsData: AllocatedRoom[] = roomsToBook.map(r => ({
      roomTypeId: r.roomTypeId,
      roomNumber: r.roomNumber,
      ratePerNight: r.ratePerNight,
    }));

    const assignedRoomNumbers = roomsToBook.map(r => r.roomNumber);

    const res = createReservation({
      guestId: targetGuestId,
      guestName: primaryFullName,
      guestMobile: primaryMember.mobile.trim(),
      guestEmail: guestEmail.trim() || undefined,
      roomTypeId: roomsToBook[0].roomTypeId,
      roomNumber: roomsToBook[0].roomNumber,
      allocatedRooms: allocatedRoomsData,
      assignedRoomNumbers,
      members: reservationMembers,
      adults: members.length,
      children: 0,
      checkInDate,
      checkOutDate,
      numberOfNights: nights,
      ratePerNight: totalRoomNightlyRate,
      discount: 0,
      taxAmount,
      totalAmount,
      advancePaid,
      balanceAmount,
      bookingSource,
      status: 'Confirmed',
      specialRequests: specialRequests.trim() || undefined,
      idDocumentPhoto: primaryMember.idDocumentPhoto || undefined,
    });

    if (res.success && res.reservation) {
      success(res.message, 'Booking Created');
      setConfirmedBooking(res.reservation);
      setConfirmationModalOpen(true);
      onClose();
    } else {
      error(res.message, 'Booking Conflict');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Create New Reservation" maxWidth="4xl">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs max-h-[80vh] overflow-y-auto px-1 pr-2">
          
          {/* Section 1: Dates & Booking Channel */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Calendar className="w-4 h-4 text-teal-600" /> Stay Dates & Channel
              </span>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                {nights} Night{nights > 1 ? 's' : ''} Stay
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Check-in Date *</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={e => setCheckInDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Check-out Date *</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={e => setCheckOutDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Booking Channel / Source</label>
                <select
                  value={bookingSource}
                  onChange={e => setBookingSource(e.target.value as BookingSource)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white font-medium"
                >
                  <option value="Direct Walk-in">Direct Walk-in</option>
                  <option value="Website">Official Website</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="MakeMyTrip">MakeMyTrip</option>
                  <option value="Agoda">Agoda</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Flexible Multi-Room Allotment (e.g. 2 Single Beds + 1 Double Bed) */}
          <div className="bg-white p-3.5 rounded-2xl border border-teal-100/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <BedDouble className="w-4 h-4 text-teal-600" /> Room Allotment ({roomsToBook.length} Room{roomsToBook.length > 1 ? 's' : ''})
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Guest requirement ke hisaab se multiple rooms (e.g. 2 Single Bed + 1 Double Bed) allot karein
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRoomRow}
                className="flex items-center gap-1 text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold px-2.5 py-1 rounded-xl border border-teal-200 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Room
              </button>
            </div>

            <div className="space-y-2.5">
              {roomsToBook.map((row, idx) => {
                // Available rooms for this room category
                const currentlySelectedOtherRooms = roomsToBook
                  .filter(r => r.id !== row.id && r.roomNumber)
                  .map(r => r.roomNumber);

                const availableRoomsForType = rooms.filter(
                  r =>
                    r.roomTypeId === row.roomTypeId &&
                    r.status !== 'Maintenance' &&
                    r.status !== 'Out of Service' &&
                    !currentlySelectedOtherRooms.includes(r.roomNumber)
                );

                const selectedTypeObj = roomTypes.find(rt => rt.id === row.roomTypeId);

                return (
                  <div
                    key={row.id}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      #{idx + 1}
                    </div>

                    {/* Room Category */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Room Category
                      </label>
                      <select
                        value={row.roomTypeId}
                        onChange={e => handleRoomTypeChange(row.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-500 bg-white font-medium"
                      >
                        {roomTypes.map(rt => (
                          <option key={rt.id} value={rt.id}>
                            {rt.name} ({formatCurrency(rt.basePrice, hotelSettings.currencySymbol)}/night)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Assign Specific Room Number */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Assign Room Number *
                      </label>
                      <select
                        value={row.roomNumber}
                        onChange={e => handleRoomNumberChange(row.id, e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-500 bg-white font-bold text-teal-800"
                      >
                        <option value="">-- Select Room --</option>
                        {availableRoomsForType.map(rm => (
                          <option key={rm.roomNumber} value={rm.roomNumber}>
                            Room {rm.roomNumber} (Floor {rm.floor} • {rm.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rate per night */}
                    <div className="w-28 shrink-0">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Rate / Night
                      </label>
                      <div className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-xs text-right">
                        {formatCurrency(row.ratePerNight, hotelSettings.currencySymbol)}
                      </div>
                    </div>

                    {/* Delete room row (if more than 1) */}
                    {roomsToBook.length > 1 && (
                      <div className="sm:self-end pb-0.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveRoomRow(row.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Remove this room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: All Members Details & Document Upload */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Users className="w-4 h-4 text-teal-600" /> Guest Members & ID Documents ({members.length} Guest{members.length > 1 ? 's' : ''})
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sabhi members ka name, surname, age, mobile, address aur document/ID upload karein
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMember}
                className="flex items-center gap-1 text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold px-2.5 py-1 rounded-xl border border-teal-200 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Member / Co-Guest
              </button>
            </div>

            {/* List of Member Cards */}
            <div className="space-y-3">
              {members.map((member, idx) => {
                const isExpanded = expandedMemberId === member.id;
                const memberTitle = member.isPrimary
                  ? 'Primary Guest (Member 1)'
                  : `Guest Member #${idx + 1}`;

                return (
                  <div
                    key={member.id}
                    className={`border rounded-2xl transition-all ${
                      member.isPrimary
                        ? 'border-teal-300 bg-teal-50/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    {/* Header bar of member card */}
                    <div
                      className="p-3 flex items-center justify-between cursor-pointer select-none"
                      onClick={() => setExpandedMemberId(isExpanded ? '' : member.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            member.isPrimary
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs">
                              {member.name ? `${member.name} ${member.surname}` : memberTitle}
                            </span>
                            {member.isPrimary && (
                              <span className="bg-teal-100 text-teal-800 border border-teal-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                Primary
                              </span>
                            )}
                            {member.idDocumentPhoto && (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> ID Uploaded
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {member.mobile || 'No mobile'} • {member.idDocumentType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!member.isPrimary && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleRemoveMember(member.id);
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>

                    {/* Member Form Fields */}
                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-slate-200/60 mt-1 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
                          {/* First Name */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              First Name {member.isPrimary && <span className="text-rose-500">*</span>}
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Ramesh"
                              value={member.name}
                              onChange={e => handleMemberChange(member.id, 'name', e.target.value)}
                              required={member.isPrimary}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                            />
                          </div>

                          {/* Surname */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Surname
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Sharma"
                              value={member.surname}
                              onChange={e => handleMemberChange(member.id, 'surname', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                            />
                          </div>

                          {/* Age */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Age
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 28"
                              min="1"
                              max="120"
                              value={member.age}
                              onChange={e => handleMemberChange(member.id, 'age', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                            />
                          </div>

                          {/* Gender */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Gender
                            </label>
                            <select
                              value={member.gender}
                              onChange={e => handleMemberChange(member.id, 'gender', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Mobile */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Mobile Number {member.isPrimary && <span className="text-rose-500">*</span>}
                            </label>
                            <input
                              type="tel"
                              placeholder="+91 98765 43210"
                              value={member.mobile}
                              onChange={e => handleMemberChange(member.id, 'mobile', e.target.value)}
                              required={member.isPrimary}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                            />
                          </div>

                          {/* Address */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Address / City
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 12/B MG Road, Bangalore, Karnataka"
                              value={member.address}
                              onChange={e => handleMemberChange(member.id, 'address', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                            />
                          </div>
                        </div>

                        {/* ID Type and Number */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              ID Document Type
                            </label>
                            <select
                              value={member.idDocumentType}
                              onChange={e => handleMemberChange(member.id, 'idDocumentType', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                            >
                              <option value="Aadhaar">Aadhaar Card</option>
                              <option value="Passport">Passport</option>
                              <option value="Driving License">Driving License</option>
                              <option value="Voter ID">Voter ID</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              ID Document Number
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 5432 9876 1234"
                              value={member.idDocumentNumber}
                              onChange={e => handleMemberChange(member.id, 'idDocumentNumber', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white font-mono"
                            />
                          </div>
                        </div>

                        {/* Document Photo Upload Component */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                            {member.name || `Member #${idx + 1}`}'s Document / ID Photo Upload
                          </label>
                          <IdPhotoUploader
                            value={member.idDocumentPhoto}
                            onChange={photoData => handleMemberChange(member.id, 'idDocumentPhoto', photoData)}
                            documentType={`${member.idDocumentType} of ${member.name || 'Guest'}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Email & Special Requests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Guest Email (Optional)</label>
              <input
                type="email"
                placeholder="guest@mail.com"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Special Requests / Preferences</label>
              <input
                type="text"
                placeholder="e.g. Ground floor preference, extra pillows, early check-in"
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
              />
            </div>
          </div>

          {/* Section 5: Rate Calculation & Advance Payment */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <span className="text-[11px] text-slate-500 block">Stay Duration & Breakdown:</span>
                <span className="font-bold text-slate-800 text-xs">
                  {nights} Night(s) • {roomsToBook.length} Room(s) • {members.length} Guest(s)
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Room Rate: {formatCurrency(totalRoomNightlyRate, hotelSettings.currencySymbol)}/night + {hotelSettings.taxRatePercent}% GST
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Advance Token Received ({hotelSettings.currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={advancePaid}
                  onChange={e => setAdvancePaid(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 font-bold text-slate-900 bg-white"
                />
              </div>

              <div className="sm:text-right">
                <span className="text-[11px] text-slate-500 block">Total Stay Charges (inc. GST):</span>
                <span className="text-lg font-extrabold text-teal-700 block">
                  {formatCurrency(totalAmount, hotelSettings.currencySymbol)}
                </span>
                <span className="text-[11px] text-slate-600 block">
                  Advance: <b className="text-emerald-700">{formatCurrency(advancePaid, hotelSettings.currencySymbol)}</b> | Balance: <b className="text-amber-700">{formatCurrency(balanceAmount, hotelSettings.currencySymbol)}</b>
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Reservation ({roomsToBook.length} Room{roomsToBook.length > 1 ? 's' : ''})
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Slip modal */}
      <BookingConfirmationModal
        isOpen={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        reservation={confirmedBooking}
      />
    </>
  );
};
