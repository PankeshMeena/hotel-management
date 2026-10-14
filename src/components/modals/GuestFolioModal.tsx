import React from 'react';
import { Modal } from '../ui/Modal';
import { Guest } from '../../types';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency, formatDate, maskPhoneNumber, maskAadhaarNumber } from '../../lib/utils';
import { Printer, User, History, CreditCard, ShieldCheck } from 'lucide-react';
import { VerificationBadge, ReservationStatusBadge } from '../ui/Badge';

interface GuestFolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
}

export const GuestFolioModal: React.FC<GuestFolioModalProps> = ({
  isOpen,
  onClose,
  guest,
}) => {
  const { hotelSettings, reservations, transactions } = useHotel();

  if (!guest) return null;

  const guestReservations = reservations.filter(r => r.guestId === guest.id);
  const guestTransactions = transactions.filter(t => t.guestId === guest.id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guest Portfolio & Ledger Folio" maxWidth="3xl">
      <div className="flex justify-end mb-4 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Guest Folio
        </button>
      </div>

      <div className="bg-white p-6 border border-slate-300 rounded-xl text-slate-800 text-xs">
        {/* Guest Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900">{guest.fullName}</span>
              <VerificationBadge status={guest.idVerificationStatus} />
            </div>
            <p className="text-slate-500 mt-1">
              Guest ID: <span className="font-semibold text-slate-800">{guest.id}</span> • Member since {formatDate(guest.createdAt)}
            </p>
            <p className="text-slate-600">
              {guest.address}, {guest.city}, {guest.state}, {guest.country}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-slate-500 text-[11px] block">Contact & Identity:</span>
            <p className="font-semibold text-slate-900">{maskPhoneNumber(guest.mobile)}</p>
            <p className="text-slate-600">{guest.email || 'No email'}</p>
            <p className="text-[11px] text-teal-700 font-medium mt-0.5">
              {guest.idDocumentType}: {maskAadhaarNumber(guest.idDocumentNumber)}
            </p>
          </div>
        </div>

        {/* Attached Aadhaar Card Photo */}
        {guest.idDocumentPhoto && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={guest.idDocumentPhoto}
                alt="Aadhaar ID Card"
                className="w-28 h-18 object-contain rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs"
              />
              <div>
                <span className="font-bold text-slate-800 text-xs block">
                  Digital {guest.idDocumentType} on File
                </span>
                <p className="text-[11px] text-slate-500">
                  Document scanned and verified for police verification and hotel register
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
              ✓ Verified Identity
            </span>
          </div>
        )}

        {/* Lifetime Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Stays</span>
            <span className="font-bold text-slate-900 text-base">{guest.totalStays || guestReservations.length}</span>
          </div>
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-center">
            <span className="text-teal-700 font-bold uppercase text-[10px] block">Lifetime Spend</span>
            <span className="font-bold text-teal-900 text-base">
              {formatCurrency(guest.totalSpent || guestReservations.reduce((s, r) => s + r.totalAmount, 0), hotelSettings.currencySymbol)}
            </span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-amber-700 font-bold uppercase text-[10px] block">Pending Balance</span>
            <span className="font-bold text-amber-900 text-base">
              {formatCurrency(
                guestReservations.filter(r => r.status === 'Checked In' || r.status === 'Confirmed').reduce((s, r) => s + r.balanceAmount, 0),
                hotelSettings.currencySymbol
              )}
            </span>
          </div>
        </div>

        {/* Stay History Table */}
        <div className="mb-5">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-teal-600" /> Stay History ({guestReservations.length})
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">Booking ID</th>
                  <th className="py-2 px-3">Room</th>
                  <th className="py-2 px-3">Stay Dates</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Total Bill</th>
                  <th className="py-2 px-3 text-right">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guestReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-3 text-slate-400 italic">No bookings on record.</td>
                  </tr>
                ) : (
                  guestReservations.map(res => (
                    <tr key={res.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{res.id}</td>
                      <td className="py-2.5 px-3 font-bold text-teal-700">Room {res.roomNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {formatDate(res.checkInDate)} to {formatDate(res.checkOutDate)} ({res.numberOfNights}n)
                      </td>
                      <td className="py-2.5 px-3">
                        <ReservationStatusBadge status={res.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                        {formatCurrency(res.totalAmount, hotelSettings.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(res.advancePaid, hotelSettings.currencySymbol)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transactions Ledger */}
        <div>
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-teal-600" /> Payments & Transactions
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">Txn ID</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Booking</th>
                  <th className="py-2 px-3">Method</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guestTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-3 text-slate-400 italic">No transactions recorded.</td>
                  </tr>
                ) : (
                  guestTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">{tx.id}</td>
                      <td className="py-2 px-3 text-slate-500">{tx.createdAt}</td>
                      <td className="py-2 px-3 text-slate-700">{tx.reservationId}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{tx.paymentMethod}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          tx.type === 'Refund' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${tx.type === 'Refund' ? 'text-rose-600' : 'text-slate-900'}`}>
                        {formatCurrency(tx.amount, hotelSettings.currencySymbol)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {guest.notes && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs">
            <span className="font-semibold text-slate-800 block mb-0.5">Guest Notes:</span>
            {guest.notes}
          </div>
        )}
      </div>
    </Modal>
  );
};
