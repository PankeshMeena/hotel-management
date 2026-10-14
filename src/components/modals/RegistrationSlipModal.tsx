import React from 'react';
import { Modal } from '../ui/Modal';
import { Reservation, Guest } from '../../types';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency, formatDate, maskPhoneNumber, maskAadhaarNumber } from '../../lib/utils';
import { Printer, CheckCircle, ShieldCheck } from 'lucide-react';

interface RegistrationSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  guest?: Guest | null;
}

export const RegistrationSlipModal: React.FC<RegistrationSlipModalProps> = ({
  isOpen,
  onClose,
  reservation,
  guest,
}) => {
  const { hotelSettings, roomTypes } = useHotel();

  if (!reservation) return null;

  const roomType = roomTypes.find(rt => rt.id === reservation.roomTypeId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guest Registration Slip" maxWidth="3xl">
      <div className="flex justify-end mb-4 no-print gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
        >
          <Printer className="w-4 h-4" />
          Print Registration Card
        </button>
      </div>

      {/* Printable Card */}
      <div id="registration-slip-print" className="bg-white p-6 border border-slate-300 rounded-xl text-slate-800 text-sm">
        {/* Header */}
        <div className="text-center border-b border-slate-300 pb-4 mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-700 text-white font-bold text-xl mb-1">
            U
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            {hotelSettings.name}
          </h2>
          <p className="text-xs text-slate-500">{hotelSettings.tagline}</p>
          <p className="text-xs text-slate-600 mt-1">
            {hotelSettings.address} • Ph: {hotelSettings.phone} • Email: {hotelSettings.email}
          </p>
          <p className="text-xs font-medium text-slate-700 mt-0.5">
            GSTIN: {hotelSettings.gstin}
          </p>
          <div className="mt-3 inline-block bg-slate-100 border border-slate-300 px-4 py-1 rounded-full text-xs font-bold tracking-wider text-slate-800 uppercase">
            Official Guest Registration Card (Form C / Front Desk Slip)
          </div>
        </div>

        {/* Booking & Room Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-xs">
          <div>
            <span className="text-slate-500 block">Registration No:</span>
            <span className="font-bold text-slate-900">{reservation.id}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Room Number:</span>
            <span className="font-bold text-teal-700 text-base">Room {reservation.roomNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Room Category:</span>
            <span className="font-semibold text-slate-900">{roomType?.name || reservation.roomTypeId}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Booking Source:</span>
            <span className="font-semibold text-slate-900">{reservation.bookingSource}</span>
          </div>
        </div>

        {/* Guest Details */}
        <div className="border border-slate-200 rounded-lg p-4 mb-4">
          <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2 border-b border-slate-100 pb-1 flex items-center justify-between">
            <span>Primary Guest Information</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium normal-case text-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> ID Verified in Demo
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Full Legal Name:</span>
              <p className="font-semibold text-slate-900 text-sm">{reservation.guestName}</p>
            </div>
            <div>
              <span className="text-slate-500">Contact Number:</span>
              <p className="font-semibold text-slate-900">{maskPhoneNumber(reservation.guestMobile)}</p>
            </div>
            <div>
              <span className="text-slate-500">Email Address:</span>
              <p className="font-medium text-slate-900">{reservation.guestEmail || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-slate-500">City & State:</span>
              <p className="font-medium text-slate-900">{guest ? `${guest.city}, ${guest.state}` : 'Ujjain Visit'}</p>
            </div>
            <div>
              <span className="text-slate-500">ID Document Presented:</span>
              <p className="font-semibold text-slate-900">
                {guest?.idDocumentType || 'Aadhaar'} ({maskAadhaarNumber(guest?.idDocumentNumber || '•••• •••• 4892')})
              </p>
            </div>
            <div>
              <span className="text-slate-500">No. of Occupants:</span>
              <p className="font-semibold text-slate-900">{reservation.adults} Adults, {reservation.children} Children</p>
            </div>
          </div>

          {/* Uploaded Aadhaar Photo Attachment on Registration Card */}
          {(reservation.idDocumentPhoto || guest?.idDocumentPhoto) && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <img
                  src={reservation.idDocumentPhoto || guest?.idDocumentPhoto}
                  alt="Aadhaar ID Card"
                  className="w-28 h-18 object-contain rounded-lg border border-slate-300 bg-white p-0.5 shrink-0 shadow-2xs"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">
                    Verified {guest?.idDocumentType || 'Aadhaar Card'} Attachment
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Digitally archived in reception records for Form C guest register compliance
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Photo Match Confirmed at Check-in
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stay & Tariff Details */}
        <div className="border border-slate-200 rounded-lg p-4 mb-4">
          <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2 border-b border-slate-100 pb-1">
            Stay Schedule & Tariffs
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
            <div>
              <span className="text-slate-500">Arrival Date:</span>
              <p className="font-bold text-slate-900">{formatDate(reservation.checkInDate)}</p>
              <span className="text-[10px] text-slate-400">Check-in: {hotelSettings.checkInTime}</span>
            </div>
            <div>
              <span className="text-slate-500">Departure Date:</span>
              <p className="font-bold text-slate-900">{formatDate(reservation.checkOutDate)}</p>
              <span className="text-[10px] text-slate-400">Check-out: {hotelSettings.checkOutTime}</span>
            </div>
            <div>
              <span className="text-slate-500">Total Duration:</span>
              <p className="font-bold text-slate-900">{reservation.numberOfNights} Night(s)</p>
            </div>
            <div>
              <span className="text-slate-500">Room Rate / Night:</span>
              <p className="font-bold text-slate-900">{formatCurrency(reservation.ratePerNight, hotelSettings.currencySymbol)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Total Est. Bill:</span>
              <span className="font-bold text-slate-900">{formatCurrency(reservation.totalAmount, hotelSettings.currencySymbol)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Advance Deposited:</span>
              <span className="font-bold text-emerald-700">{formatCurrency(reservation.advancePaid, hotelSettings.currencySymbol)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Balance Payable:</span>
              <span className="font-bold text-amber-700">{formatCurrency(reservation.balanceAmount, hotelSettings.currencySymbol)}</span>
            </div>
          </div>
        </div>

        {/* Declarations & Signature */}
        <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 leading-relaxed mb-6">
          <p className="mb-1 font-semibold text-slate-700">Guest Declaration & Hotel Rules:</p>
          <p>
            I hereby certify that all particulars given above are correct. I agree to abide by the rules and regulations of {hotelSettings.name}. Possession or consumption of alcoholic beverages and tobacco is strictly prohibited on hotel premises. Check-out time is {hotelSettings.checkOutTime}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed border-slate-300">
          <div className="text-center">
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <span className="text-xs font-semibold text-slate-700">Guest Signature</span>
          </div>
          <div className="text-center">
            <div className="h-10 border-b border-slate-400 mb-1 flex items-end justify-center pb-1">
              <span className="text-xs font-medium text-slate-600">{reservation.createdBy} (Reception Desk)</span>
            </div>
            <span className="text-xs font-semibold text-slate-700">Authorized Front Desk Officer</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
