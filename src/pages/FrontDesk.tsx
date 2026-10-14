import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { Reservation, Guest, PaymentMethod } from '../types';
import { formatCurrency, formatDate, maskPhoneNumber, maskAadhaarNumber } from '../lib/utils';
import {
  ConciergeBell,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  ShieldAlert,
  AlertCircle,
  Plus,
  Printer,
  FileText,
  CreditCard,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { WalkInModal } from '../components/modals/WalkInModal';
import { RegistrationSlipModal } from '../components/modals/RegistrationSlipModal';
import { InvoiceModal } from '../components/modals/InvoiceModal';
import { Modal } from '../components/ui/Modal';
import { VerificationBadge, ReservationStatusBadge } from '../components/ui/Badge';

export const FrontDesk: React.FC = () => {
  const {
    reservations,
    rooms,
    guests,
    hotelSettings,
    checkInReservation,
    processCheckOut,
  } = useHotel();
  const { success, error } = useToast();

  const todayStr = '2026-10-14';

  const [activeTab, setActiveTab] = useState<'arrivals' | 'inhouse' | 'departures' | 'pending-id' | 'pending-pay'>('arrivals');

  // Modals state
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [selectedResForSlip, setSelectedResForSlip] = useState<Reservation | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [selectedResForInvoice, setSelectedResForInvoice] = useState<Reservation | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Checkout modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutRes, setCheckoutRes] = useState<Reservation | null>(null);
  const [extraCharges, setExtraCharges] = useState<number>(0);
  const [finalDiscount, setFinalDiscount] = useState<number>(0);
  const [finalPaymentMethod, setFinalPaymentMethod] = useState<PaymentMethod>('UPI');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  // Tab data
  const arrivalsToday = reservations.filter(
    r => r.checkInDate === todayStr && (r.status === 'Confirmed' || r.status === 'Pending')
  );

  const inHouseGuests = reservations.filter(r => r.status === 'Checked In');

  const departuresToday = reservations.filter(
    r => r.checkOutDate === todayStr && r.status === 'Checked In'
  );

  const pendingIdVerification = inHouseGuests.filter(r => {
    const g = guests.find(guest => guest.id === r.guestId);
    return g?.idVerificationStatus === 'Pending';
  });

  const pendingPayments = inHouseGuests.filter(r => r.balanceAmount > 0);

  const handleCheckIn = (res: Reservation) => {
    const result = checkInReservation(res.id);
    if (result.success) {
      success(result.message, 'Checked In');
      setSelectedResForSlip(res);
      setSlipModalOpen(true);
    } else {
      error(result.message, 'Check-in Error');
    }
  };

  const handleOpenCheckoutModal = (res: Reservation) => {
    setCheckoutRes(res);
    setExtraCharges(0);
    setFinalDiscount(0);
    setFinalPaymentMethod('UPI');
    setCheckoutNotes(`Departure settlement for Room ${res.roomNumber}`);
    setCheckoutModalOpen(true);
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutRes) return;

    const baseBalance = checkoutRes.balanceAmount + extraCharges - finalDiscount;
    const finalAmountToCollect = Math.max(0, baseBalance);

    const result = processCheckOut(checkoutRes.id, {
      amount: finalAmountToCollect,
      method: finalPaymentMethod,
      notes: checkoutNotes,
    });

    if (result.success) {
      success(result.message, 'Check-out Completed');
      setSelectedResForInvoice(checkoutRes);
      setInvoiceModalOpen(true);
      setCheckoutModalOpen(false);
    } else {
      error(result.message, 'Check-out Failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Front Desk Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <ConciergeBell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Front Desk Operations & Desk Workspace
              </h2>
              <p className="text-xs text-slate-500">
                Shift Date: <span className="font-semibold text-slate-700">14 Oct 2026</span> • Check-in: {hotelSettings.checkInTime} • Check-out: {hotelSettings.checkOutTime}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setWalkInModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Walk-in Check-in Desk
        </button>
      </div>

      {/* Operational Workspace Tabs */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto touch-scroll pb-px">
        <button
          onClick={() => setActiveTab('arrivals')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'arrivals'
              ? 'border-teal-600 text-teal-700 bg-teal-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-teal-600" />
          Expected Arrivals ({arrivalsToday.length})
        </button>

        <button
          onClick={() => setActiveTab('inhouse')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'inhouse'
              ? 'border-teal-600 text-teal-700 bg-teal-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          Currently Staying ({inHouseGuests.length})
        </button>

        <button
          onClick={() => setActiveTab('departures')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'departures'
              ? 'border-teal-600 text-teal-700 bg-teal-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-600" />
          Expected Departures ({departuresToday.length})
        </button>

        <button
          onClick={() => setActiveTab('pending-id')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'pending-id'
              ? 'border-teal-600 text-teal-700 bg-teal-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          Pending ID ({pendingIdVerification.length})
        </button>

        <button
          onClick={() => setActiveTab('pending-pay')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'pending-pay'
              ? 'border-teal-600 text-teal-700 bg-teal-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-600" />
          Pending Balance ({pendingPayments.length})
        </button>
      </div>

      {/* Tab 1: Expected Arrivals */}
      {activeTab === 'arrivals' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Incoming Guests Expected Today ({arrivalsToday.length})
            </h3>
            <span className="text-[11px] text-slate-500">Standard Check-in begins at 12:00 PM</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Booking ID</th>
                  <th className="py-2.5 px-4">Guest Name</th>
                  <th className="py-2.5 px-4">Assigned Room</th>
                  <th className="py-2.5 px-4">Stay Duration</th>
                  <th className="py-2.5 px-4">Channel</th>
                  <th className="py-2.5 px-4">Advance Paid</th>
                  <th className="py-2.5 px-4">Balance</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {arrivalsToday.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      All arrivals for today have been checked in or no bookings pending.
                    </td>
                  </tr>
                ) : (
                  arrivalsToday.map(res => (
                    <tr key={res.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{res.id}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{res.guestName}</p>
                        <p className="text-[11px] text-slate-400">{maskPhoneNumber(res.guestMobile)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          Room {res.roomNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(res.checkInDate)} → {formatDate(res.checkOutDate)}
                        <span className="block text-[10px] text-slate-400">({res.numberOfNights} Nights)</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{res.bookingSource}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">
                        {formatCurrency(res.advancePaid, hotelSettings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700">
                        {formatCurrency(res.balanceAmount, hotelSettings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleCheckIn(res)}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
                        >
                          Check In & Print Slip
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: In-House Guests */}
      {activeTab === 'inhouse' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Currently Staying in Hotel ({inHouseGuests.length} Active Rooms)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Room</th>
                  <th className="py-2.5 px-4">Guest Name</th>
                  <th className="py-2.5 px-4">Check-in Time</th>
                  <th className="py-2.5 px-4">Exp. Departure</th>
                  <th className="py-2.5 px-4">Occupants</th>
                  <th className="py-2.5 px-4">ID Status</th>
                  <th className="py-2.5 px-4 text-right">Balance Due</th>
                  <th className="py-2.5 px-4 text-center">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inHouseGuests.map(res => {
                  const g = guests.find(guest => guest.id === res.guestId);
                  return (
                    <tr key={res.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Room {res.roomNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{res.guestName}</p>
                        <p className="text-[11px] text-slate-400">{maskPhoneNumber(res.guestMobile)}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {res.actualCheckInTime || res.createdAt}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(res.checkOutDate)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {res.adults} Adults, {res.children} Children
                      </td>
                      <td className="py-3 px-4">
                        <VerificationBadge status={g?.idVerificationStatus || 'Verified'} />
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={res.balanceAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                          {formatCurrency(res.balanceAmount, hotelSettings.currencySymbol)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedResForSlip(res);
                              setSlipModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100"
                            title="Print Reg Card"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenCheckoutModal(res)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
                          >
                            Check Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Expected Departures */}
      {activeTab === 'departures' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Departures Scheduled for Today ({departuresToday.length})
            </h3>
            <span className="text-[11px] text-slate-500">Checkout deadline: {hotelSettings.checkOutTime}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Room</th>
                  <th className="py-2.5 px-4">Guest Name</th>
                  <th className="py-2.5 px-4">Check-in Date</th>
                  <th className="py-2.5 px-4">Total Bill</th>
                  <th className="py-2.5 px-4">Advance Paid</th>
                  <th className="py-2.5 px-4">Balance Payable</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departuresToday.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No more departures scheduled for today!
                    </td>
                  </tr>
                ) : (
                  departuresToday.map(res => (
                    <tr key={res.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-blue-800">Room {res.roomNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{res.guestName}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(res.checkInDate)}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{formatCurrency(res.totalAmount, hotelSettings.currencySymbol)}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">{formatCurrency(res.advancePaid, hotelSettings.currencySymbol)}</td>
                      <td className="py-3 px-4 font-bold text-amber-700">{formatCurrency(res.balanceAmount, hotelSettings.currencySymbol)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenCheckoutModal(res)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition shadow-xs"
                        >
                          Process Checkout & Settle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Pending ID Verification */}
      {activeTab === 'pending-id' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            In-House Guests with Pending Photo ID
          </h3>
          {pendingIdVerification.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              All current in-house guests have verified Government ID on file.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingIdVerification.map(res => (
                <div key={res.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{res.guestName}</span>
                    <span className="ml-2 font-bold text-teal-800">Room {res.roomNumber}</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Contact: {maskPhoneNumber(res.guestMobile)} • Need physical photo ID scan for Form C register
                    </p>
                  </div>
                  <button
                    onClick={() => success(`Identity marked as verified for ${res.guestName}!`)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs"
                  >
                    Mark Verified
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Pending Payments */}
      {activeTab === 'pending-pay' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            In-House Guests with Outstanding Balance
          </h3>
          {pendingPayments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              All active in-house guests are fully paid up!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {pendingPayments.map(res => (
                <div key={res.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{res.guestName}</span>
                    <span className="ml-2 font-bold text-blue-800">Room {res.roomNumber}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Check-out on {formatDate(res.checkOutDate)} • Advance Paid: {formatCurrency(res.advancePaid, hotelSettings.currencySymbol)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-700 text-sm">
                      {formatCurrency(res.balanceAmount, hotelSettings.currencySymbol)}
                    </span>
                    <button
                      onClick={() => handleOpenCheckoutModal(res)}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs"
                    >
                      Settle Balance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Check-Out Process Modal */}
      {checkoutRes && (
        <Modal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          title={`Check-Out Settlement — Room ${checkoutRes.roomNumber}`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmCheckout} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Guest: {checkoutRes.guestName}</span>
                <span className="text-teal-700">Room {checkoutRes.roomNumber}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Stayed: {formatDate(checkoutRes.checkInDate)} to {formatDate(checkoutRes.checkOutDate)} ({checkoutRes.numberOfNights} Nights)
              </p>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5">
                <span>Room Charges with GST:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(checkoutRes.totalAmount, hotelSettings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Advance Paid Earlier:</span>
                <span className="font-semibold">-{formatCurrency(checkoutRes.advancePaid, hotelSettings.currencySymbol)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Additional Services / F&B Charges ({hotelSettings.currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  value={extraCharges}
                  onChange={e => setExtraCharges(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Authorized Courtesy Discount ({hotelSettings.currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  value={finalDiscount}
                  onChange={e => setFinalDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-amber-900 block">Final Settlement Amount:</span>
                <span className="text-[11px] text-amber-700">To be collected before key handover</span>
              </div>
              <span className="text-lg font-bold text-amber-900">
                {formatCurrency(Math.max(0, checkoutRes.balanceAmount + extraCharges - finalDiscount), hotelSettings.currencySymbol)}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={finalPaymentMethod}
                onChange={e => setFinalPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / QR)</option>
                <option value="Cash">Cash at Desk</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes / Remarks</label>
              <input
                type="text"
                value={checkoutNotes}
                onChange={e => setCheckoutNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
              >
                Complete Check-Out & Generate Invoice
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Global Modals */}
      <WalkInModal isOpen={walkInModalOpen} onClose={() => setWalkInModalOpen(false)} />
      <RegistrationSlipModal isOpen={slipModalOpen} onClose={() => setSlipModalOpen(false)} reservation={selectedResForSlip} />
      <InvoiceModal isOpen={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} reservation={selectedResForInvoice} />
    </div>
  );
};
