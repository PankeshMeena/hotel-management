import React from 'react';
import { Modal } from '../ui/Modal';
import { Reservation } from '../../types';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency, formatDate, maskPhoneNumber } from '../../lib/utils';
import { Printer, CheckCircle2, Calendar, MapPin, Phone } from 'lucide-react';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const { hotelSettings, roomTypes } = useHotel();

  if (!reservation) return null;

  const roomType = roomTypes.find(rt => rt.id === reservation.roomTypeId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Booking Confirmation Voucher" maxWidth="2xl">
      <div className="flex justify-end mb-4 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Confirmation Voucher
        </button>
      </div>

      <div className="bg-white p-6 border border-slate-300 rounded-xl text-slate-800 text-xs">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4 mb-4 flex justify-between items-start">
          <div>
            <span className="font-bold text-base text-slate-900 block">{hotelSettings.name}</span>
            <p className="text-slate-500 text-[11px] mt-0.5">{hotelSettings.address}</p>
            <p className="text-slate-600 text-[11px]">Phone: {hotelSettings.phone} • Email: {hotelSettings.email}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">
              <CheckCircle2 className="w-3 h-3" /> Booking Confirmed
            </span>
            <p className="font-bold text-slate-900 text-sm mt-1.5">{reservation.id}</p>
          </div>
        </div>

        {/* Voucher Content */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Guest Name</span>
            <span className="font-bold text-slate-900 text-sm">{reservation.guestName}</span>
            <span className="block text-slate-500 text-[11px] mt-0.5">{maskPhoneNumber(reservation.guestMobile)}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Allocated Room</span>
            <span className="font-bold text-teal-800 text-sm">Room {reservation.roomNumber}</span>
            <span className="block text-slate-500 text-[11px] mt-0.5">{roomType?.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border border-slate-200 rounded-lg p-3 text-center mb-4">
          <div>
            <span className="text-slate-400 uppercase text-[10px] block">Check-in</span>
            <span className="font-bold text-slate-900">{formatDate(reservation.checkInDate)}</span>
            <span className="text-[10px] text-slate-500 block">{hotelSettings.checkInTime}</span>
          </div>
          <div className="border-x border-slate-200 px-2">
            <span className="text-slate-400 uppercase text-[10px] block">Check-out</span>
            <span className="font-bold text-slate-900">{formatDate(reservation.checkOutDate)}</span>
            <span className="text-[10px] text-slate-500 block">{hotelSettings.checkOutTime}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase text-[10px] block">Stay Length</span>
            <span className="font-bold text-slate-900">{reservation.numberOfNights} Night(s)</span>
            <span className="text-[10px] text-slate-500 block">{reservation.adults} Adults</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 mb-4 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Total Accommodation Charges (inc. GST):</span>
            <span className="font-bold text-slate-900">{formatCurrency(reservation.totalAmount, hotelSettings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>Advance Deposited:</span>
            <span className="font-semibold">{formatCurrency(reservation.advancePaid, hotelSettings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1">
            <span>Balance Payable at Check-in / Check-out:</span>
            <span className="text-amber-700">{formatCurrency(reservation.balanceAmount, hotelSettings.currencySymbol)}</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3">
          <p className="font-semibold text-slate-700 mb-0.5">Important Information:</p>
          <p>• Government issued photo ID is required for all guests at reception desk during check-in.</p>
          <p>• Check-in time: {hotelSettings.checkInTime} • Check-out time: {hotelSettings.checkOutTime}</p>
          <p>• Cancellation policy: {hotelSettings.cancellationPolicy}</p>
        </div>
      </div>
    </Modal>
  );
};
