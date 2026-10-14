import React from 'react';
import { Modal } from '../ui/Modal';
import { Reservation } from '../../types';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency, formatDate, formatDateTime, maskPhoneNumber } from '../../lib/utils';
import { Printer, Download, CheckCircle, FileText } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const { hotelSettings, roomTypes, transactions } = useHotel();

  if (!reservation) return null;

  const roomType = roomTypes.find(rt => rt.id === reservation.roomTypeId);
  const relatedTransactions = transactions.filter(
    t => t.reservationId === reservation.id && t.status === 'Success'
  );

  const subtotal = reservation.numberOfNights * reservation.ratePerNight - reservation.discount;
  const halfGst = Math.round(reservation.taxAmount / 2);
  const invoiceNumber = `${hotelSettings.invoicePrefix}${reservation.id.replace('RES-', '')}-INV`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tax Invoice & Folio" maxWidth="3xl">
      <div className="flex justify-between items-center mb-4 no-print">
        <div className="text-xs text-slate-500">
          Status:{' '}
          <span
            className={`font-semibold ${
              reservation.balanceAmount <= 0 ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {reservation.balanceAmount <= 0 ? 'Fully Paid & Settled' : 'Payment Pending'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Tax Invoice
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white p-6 sm:p-8 border border-slate-300 rounded-xl text-slate-800 text-xs">
        {/* Top Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
                U
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{hotelSettings.name}</h2>
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed">{hotelSettings.address}</p>
            <p className="text-slate-600 mt-1">Phone: {hotelSettings.phone} • Email: {hotelSettings.email}</p>
            <p className="font-semibold text-slate-700 mt-0.5">GSTIN: {hotelSettings.gstin}</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-teal-50 border border-teal-200 text-teal-800 font-bold px-3 py-1 rounded text-xs uppercase tracking-wider mb-2">
              Tax Invoice / Bill
            </span>
            <p className="font-bold text-slate-900 text-sm">{invoiceNumber}</p>
            <p className="text-slate-500 mt-1">Date: {formatDate(new Date().toISOString())}</p>
            <p className="text-slate-500">Time: 10:00 AM</p>
          </div>
        </div>

        {/* Bill To & Stay Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50 mb-5">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
              Billed To Guest:
            </span>
            <p className="font-bold text-slate-900 text-sm">{reservation.guestName}</p>
            <p className="text-slate-600 mt-0.5">Mobile: {maskPhoneNumber(reservation.guestMobile)}</p>
            {reservation.guestEmail && <p className="text-slate-600">Email: {reservation.guestEmail}</p>}
            <p className="text-slate-500 mt-1">Guest ID: {reservation.guestId}</p>
          </div>
          <div className="sm:border-l sm:border-slate-200 sm:pl-4">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
              Reservation Information:
            </span>
            <p className="text-slate-700">
              <span className="text-slate-500">Booking Ref:</span> <span className="font-semibold text-slate-900">{reservation.id}</span>
            </p>
            <p className="text-slate-700">
              <span className="text-slate-500">Room Allocated:</span>{' '}
              <span className="font-bold text-teal-700">Room {reservation.roomNumber}</span> ({roomType?.name || 'Room'})
            </p>
            <p className="text-slate-700">
              <span className="text-slate-500">Check-in:</span> {formatDate(reservation.checkInDate)} ({reservation.actualCheckInTime || hotelSettings.checkInTime})
            </p>
            <p className="text-slate-700">
              <span className="text-slate-500">Check-out:</span> {formatDate(reservation.checkOutDate)} ({reservation.actualCheckOutTime || hotelSettings.checkOutTime})
            </p>
            <p className="text-slate-700">
              <span className="text-slate-500">Occupants:</span> {reservation.adults} Adults, {reservation.children} Children
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-left border-collapse mb-5">
          <thead>
            <tr className="border-b border-slate-300 text-slate-500 text-[11px] uppercase tracking-wider bg-slate-100">
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 text-center">Nights</th>
              <th className="py-2.5 px-3 text-right">Tariff / Night</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="py-3 px-3">
                <span className="font-semibold text-slate-900">Room Accommodation</span>
                <span className="block text-slate-500 text-[11px]">
                  Room {reservation.roomNumber} — {roomType?.name} ({formatDate(reservation.checkInDate)} to {formatDate(reservation.checkOutDate)})
                </span>
              </td>
              <td className="py-3 px-3 text-center font-medium text-slate-700">{reservation.numberOfNights}</td>
              <td className="py-3 px-3 text-right text-slate-700">
                {formatCurrency(reservation.ratePerNight, hotelSettings.currencySymbol)}
              </td>
              <td className="py-3 px-3 text-right font-medium text-slate-900">
                {formatCurrency(reservation.numberOfNights * reservation.ratePerNight, hotelSettings.currencySymbol)}
              </td>
            </tr>

            {reservation.discount > 0 && (
              <tr>
                <td className="py-2 px-3 text-emerald-700 font-medium" colSpan={3}>
                  Authorized Discount / Promotional Rebate
                </td>
                <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                  -{formatCurrency(reservation.discount, hotelSettings.currencySymbol)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Financial Calculation Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t border-slate-200 pt-3 mb-5">
          <div className="w-full sm:w-1/2">
            <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">
              Payment Receipts Log:
            </h5>
            {relatedTransactions.length === 0 ? (
              <p className="text-slate-400 text-xs italic">No transactions recorded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {relatedTransactions.map(tx => (
                  <div key={tx.id} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-800">{tx.type} ({tx.paymentMethod})</span>
                      <span className="block text-[10px] text-slate-400">{tx.createdAt} • Ref: {tx.referenceNumber || 'Cash/Desk'}</span>
                    </div>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(tx.amount, hotelSettings.currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full sm:w-5/12 bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (Taxable):</span>
              <span className="font-medium text-slate-900">{formatCurrency(subtotal, hotelSettings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>CGST ({hotelSettings.taxRatePercent / 2}%):</span>
              <span>{formatCurrency(halfGst, hotelSettings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>SGST ({hotelSettings.taxRatePercent / 2}%):</span>
              <span>{formatCurrency(halfGst, hotelSettings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
              <span>Grand Total:</span>
              <span>{formatCurrency(reservation.totalAmount, hotelSettings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Total Paid:</span>
              <span>{formatCurrency(reservation.advancePaid, hotelSettings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5">
              <span>Balance Due:</span>
              <span className={reservation.balanceAmount > 0 ? 'text-amber-600' : 'text-emerald-700'}>
                {formatCurrency(reservation.balanceAmount, hotelSettings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between items-end gap-4">
          <div>
            <p className="font-semibold text-slate-600">Terms & Conditions:</p>
            <p>1. Goods and Services Tax (GST) charged under composite hospitality rate.</p>
            <p>2. This is a computer generated invoice and carries authorized stamp of {hotelSettings.name}.</p>
            <p>3. Subject to Ujjain Jurisdiction.</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-slate-800 font-bold mb-8">For {hotelSettings.name}</p>
            <p className="text-xs font-semibold text-slate-700 border-t border-slate-300 pt-1 px-4 inline-block">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
