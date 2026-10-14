import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHotel } from '../../context/HotelContext';
import { useToast } from '../ui/Toast';
import { BookingSource, Reservation } from '../../types';
import { formatCurrency, calculateNights } from '../../lib/utils';
import { Calendar, User, Phone, CheckCircle2 } from 'lucide-react';
import { BookingConfirmationModal } from './BookingConfirmationModal';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewReservationModal: React.FC<NewReservationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { rooms, roomTypes, hotelSettings, createReservation, guests, addGuest } = useHotel();
  const { success, error, warning } = useToast();

  const todayStr = '2026-10-14';
  const tomorrowStr = '2026-10-15';

  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id || 'single');
  const [roomNumber, setRoomNumber] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [advancePaid, setAdvancePaid] = useState<number>(500);
  const [bookingSource, setBookingSource] = useState<BookingSource>('Website');
  const [specialRequests, setSpecialRequests] = useState('');

  const [confirmedBooking, setConfirmedBooking] = useState<Reservation | null>(null);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  // Available rooms matching roomTypeId
  const availableRoomsForType = rooms.filter(
    r => r.roomTypeId === roomTypeId && r.status !== 'Maintenance' && r.status !== 'Out of Service'
  );

  const selectedType = roomTypes.find(rt => rt.id === roomTypeId) || roomTypes[0];
  const nights = calculateNights(checkInDate, checkOutDate);
  const ratePerNight = selectedType ? selectedType.basePrice : 999;
  const subtotal = nights * ratePerNight;
  const taxAmount = Math.round(subtotal * (hotelSettings.taxRatePercent / 100));
  const totalAmount = subtotal + taxAmount;
  const balanceAmount = Math.max(0, totalAmount - advancePaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim() || !guestMobile.trim()) {
      error('Guest name and mobile are required.');
      return;
    }

    if (!roomNumber) {
      error('Please assign a room to the booking.');
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      error('Check-out date must be after check-in date.');
      return;
    }

    // Check if guest exists or create one
    let targetGuestId = 'GST-NEW';
    const existingGuest = guests.find(g => g.mobile.replace(/\s+/g, '') === guestMobile.replace(/\s+/g, ''));
    if (existingGuest) {
      targetGuestId = existingGuest.id;
    } else {
      const createdGuest = addGuest({
        fullName: guestName,
        mobile: guestMobile,
        email: guestEmail || undefined,
        address: 'Direct Reservation',
        city: 'Guest City',
        state: 'State',
        country: 'India',
        idDocumentType: 'Aadhaar',
        idDocumentNumber: '•••• •••• 9999',
        idVerificationStatus: 'Pending',
      });
      targetGuestId = createdGuest.id;
    }

    const res = createReservation({
      guestId: targetGuestId,
      guestName: guestName.trim(),
      guestMobile: guestMobile.trim(),
      guestEmail: guestEmail.trim() || undefined,
      roomTypeId,
      roomNumber,
      adults,
      children,
      checkInDate,
      checkOutDate,
      numberOfNights: nights,
      ratePerNight,
      discount: 0,
      taxAmount,
      totalAmount,
      advancePaid,
      balanceAmount,
      bookingSource,
      status: 'Confirmed',
      specialRequests: specialRequests || undefined,
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
      <Modal isOpen={isOpen} onClose={onClose} title="Create New Reservation" maxWidth="2xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Guest Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Meera Raghunathan"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98400 33456"
                value={guestMobile}
                onChange={e => setGuestMobile(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="guest@mail.com"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Booking Channel / Source</label>
              <select
                value={bookingSource}
                onChange={e => setBookingSource(e.target.value as BookingSource)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-in Date</label>
              <input
                type="date"
                value={checkInDate}
                onChange={e => setCheckInDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-out Date</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={e => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room Category</label>
              <select
                value={roomTypeId}
                onChange={e => {
                  setRoomTypeId(e.target.value);
                  setRoomNumber('');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white font-medium"
              >
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({formatCurrency(rt.basePrice, hotelSettings.currencySymbol)}/nt)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assign Room <span className="text-rose-500">*</span>
              </label>
              <select
                value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white font-bold text-teal-800"
              >
                <option value="">-- Choose Room --</option>
                {availableRoomsForType.map(rm => (
                  <option key={rm.roomNumber} value={rm.roomNumber}>
                    Room {rm.roomNumber} (Floor {rm.floor} - {rm.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adults</label>
              <input
                type="number"
                min="1"
                max={selectedType.maxOccupancy}
                value={adults}
                onChange={e => setAdults(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Advance Token Received</label>
              <input
                type="number"
                min="0"
                max={totalAmount}
                value={advancePaid}
                onChange={e => setAdvancePaid(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Special Requests</label>
            <input
              type="text"
              placeholder="e.g. Late evening check-in, ground floor preference"
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Rate Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
            <div>
              <span className="font-semibold text-slate-700">{nights} Night(s) Stay • Total with GST:</span>
              <span className="block text-slate-500 text-[11px]">
                Advance: {formatCurrency(advancePaid, hotelSettings.currencySymbol)} | Balance: {formatCurrency(balanceAmount, hotelSettings.currencySymbol)}
              </span>
            </div>
            <span className="text-base font-bold text-teal-700">
              {formatCurrency(totalAmount, hotelSettings.currencySymbol)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Confirm Reservation
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
