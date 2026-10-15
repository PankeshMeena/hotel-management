import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Reservation } from '../../types';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency, formatDate, maskPhoneNumber } from '../../lib/utils';
import { Printer, CheckCircle2, Calendar, MapPin, Phone, Users, BedDouble, ShieldCheck, Eye, X } from 'lucide-react';

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
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!reservation) return null;

  const roomType = roomTypes.find(rt => rt.id === reservation.roomTypeId);

  const handlePrint = () => {
    window.print();
  };

  const allAssignedRooms = reservation.assignedRoomNumbers && reservation.assignedRoomNumbers.length > 0
    ? reservation.assignedRoomNumbers
    : [reservation.roomNumber];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Booking Confirmation Voucher" maxWidth="3xl">
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

          {/* Guest & Room Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Primary Guest</span>
              <span className="font-bold text-slate-900 text-sm">{reservation.guestName}</span>
              <span className="block text-slate-500 text-[11px] mt-0.5">{maskPhoneNumber(reservation.guestMobile)}</span>
              {reservation.guestEmail && (
                <span className="block text-slate-400 text-[11px]">{reservation.guestEmail}</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">
                Allocated Room(s) ({allAssignedRooms.length} Room{allAssignedRooms.length > 1 ? 's' : ''})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {allAssignedRooms.map(rm => (
                  <span
                    key={rm}
                    className="font-bold text-teal-800 bg-teal-100/80 border border-teal-300 px-2.5 py-0.5 rounded-lg text-xs"
                  >
                    Room {rm}
                  </span>
                ))}
              </div>
              {reservation.allocatedRooms && reservation.allocatedRooms.length > 0 ? (
                <div className="text-slate-500 text-[11px] mt-1 space-y-0.5">
                  {reservation.allocatedRooms.map((ar, i) => {
                    const rt = roomTypes.find(t => t.id === ar.roomTypeId);
                    return (
                      <span key={i} className="inline-block mr-2 text-[10px] bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600">
                        Rm {ar.roomNumber}: {rt?.name || ar.roomTypeId}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="block text-slate-500 text-[11px] mt-0.5">{roomType?.name}</span>
              )}
            </div>
          </div>

          {/* Dates & Guests */}
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
              <span className="text-slate-400 uppercase text-[10px] block">Stay & Guests</span>
              <span className="font-bold text-slate-900">{reservation.numberOfNights} Night(s)</span>
              <span className="text-[10px] text-slate-500 block">
                {reservation.members?.length || reservation.adults} Guest(s) • {allAssignedRooms.length} Room(s)
              </span>
            </div>
          </div>

          {/* Registered Members & Document Status */}
          {reservation.members && reservation.members.length > 0 && (
            <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100/80 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between font-bold text-slate-700 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-600" /> Registered Guest Members & Documents ({reservation.members.length})
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {reservation.members.map((mem, i) => (
                  <div key={mem.id || i} className="p-2.5 flex items-center justify-between text-xs bg-white">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">
                          {mem.name} {mem.surname}
                        </span>
                        {mem.isPrimary && (
                          <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded font-bold">
                            Primary Guest
                          </span>
                        )}
                        {mem.age && (
                          <span className="text-[10px] text-slate-400">({mem.age} yrs, {mem.gender || 'Adult'})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {mem.mobile && <span>Phone: {maskPhoneNumber(mem.mobile)} • </span>}
                        <span>{mem.idDocumentType}: {mem.idDocumentNumber || 'Not specified'}</span>
                        {mem.address && <span className="block text-slate-400 text-[10px]">Address: {mem.address}</span>}
                      </div>
                    </div>

                    <div>
                      {mem.idDocumentPhoto ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(mem.idDocumentPhoto || null)}
                          className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold px-2 py-1 rounded-lg transition"
                        >
                          <Eye className="w-3 h-3" /> View ID Proof
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          No ID Uploaded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Breakdown */}
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

      {/* ID Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 relative shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> Guest ID Document Proof
              </span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-2">
              <img
                src={selectedPhoto}
                alt="Uploaded ID Document"
                className="max-h-80 w-auto object-contain rounded-lg shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
