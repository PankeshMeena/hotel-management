import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { Transaction, PaymentMethod, TransactionType, Reservation } from '../types';
import { formatCurrency, formatDate, exportToExcel } from '../lib/utils';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  FileText,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { InvoiceModal } from '../components/modals/InvoiceModal';

export const Payments: React.FC = () => {
  const {
    transactions,
    reservations,
    recordPayment,
    recordRefund,
    hotelSettings,
    metrics,
  } = useHotel();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');

  // Modals state
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [recordRefundModalOpen, setRecordRefundModalOpen] = useState(false);
  const [selectedResForInvoice, setSelectedResForInvoice] = useState<Reservation | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // New Payment Form
  const [payResId, setPayResId] = useState(reservations[0]?.id || '');
  const [payAmount, setPayAmount] = useState<number>(1000);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('UPI');
  const [payType, setPayType] = useState<TransactionType>('Advance');
  const [payRef, setPayRef] = useState('UPI/8829104821');
  const [payNotes, setPayNotes] = useState('Payment at desk');

  // Refund Form
  const [refundResId, setRefundResId] = useState(reservations[0]?.id || '');
  const [refundAmount, setRefundAmount] = useState<number>(500);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('UPI');
  const [refundRef, setRefundRef] = useState('REF/UPI/998124');
  const [refundNotes, setRefundNotes] = useState('Refund due to booking cancellation');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.guestName.toLowerCase().includes(search.toLowerCase()) ||
        t.reservationId.toLowerCase().includes(search.toLowerCase()) ||
        (t.referenceNumber && t.referenceNumber.toLowerCase().includes(search.toLowerCase()));

      const matchMethod = filterMethod === 'All' || t.paymentMethod === filterMethod;
      const matchType = filterType === 'All' || t.type === filterType;

      return matchSearch && matchMethod && matchType;
    });
  }, [transactions, search, filterMethod, filterType]);

  // Financial calculations
  const totalCollections = transactions
    .filter(t => t.type !== 'Refund' && t.status === 'Success')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = transactions
    .filter(t => t.type === 'Refund' && t.status === 'Success')
    .reduce((sum, t) => sum + t.amount, 0);

  const netPayments = totalCollections - totalRefunds;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const res = reservations.find(r => r.id === payResId);
    if (!res) {
      error('Selected reservation not found.');
      return;
    }

    recordPayment({
      reservationId: res.id,
      guestId: res.guestId,
      guestName: res.guestName,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      type: payType,
      status: 'Success',
      referenceNumber: payRef,
      notes: payNotes,
    });

    success(`Payment of ₹${payAmount} recorded for ${res.guestName}!`);
    setRecordPaymentModalOpen(false);
  };

  const handleRecordRefund = (e: React.FormEvent) => {
    e.preventDefault();
    const res = reservations.find(r => r.id === refundResId);
    if (!res) {
      error('Selected reservation not found.');
      return;
    }

    recordRefund({
      reservationId: res.id,
      guestId: res.guestId,
      guestName: res.guestName,
      amount: Number(refundAmount),
      paymentMethod: refundMethod,
      status: 'Success',
      referenceNumber: refundRef,
      notes: refundNotes,
    });

    success(`Refund of ₹${refundAmount} recorded for ${res.guestName}!`);
    setRecordRefundModalOpen(false);
  };

  const handleOpenInvoice = (resId: string) => {
    const res = reservations.find(r => r.id === resId);
    if (res) {
      setSelectedResForInvoice(res);
      setInvoiceModalOpen(true);
    } else {
      error('No reservation linked to this transaction.');
    }
  };

  const handleExportExcel = () => {
    const data = filteredTransactions.map((t, idx) => ({
      'S.No': idx + 1,
      'Txn ID': t.id,
      'Date & Time': t.createdAt,
      'Booking ID': t.reservationId,
      'Guest Name': t.guestName,
      'Type': t.type,
      'Method': t.paymentMethod,
      'Amount (INR)': t.amount,
      'Status': t.status,
      'Reference / UTR': t.referenceNumber || '-',
      'Recorded By': t.recordedBy,
    }));

    exportToExcel(data, `UjjainStay_Payment_Ledger_${new Date().toISOString().slice(0, 10)}`, 'Transactions');
    success('Transactions ledger exported to Excel (.xlsx) successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-start text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Collections</span>
            <div className="p-1 rounded bg-teal-50 text-teal-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-teal-800">{formatCurrency(totalCollections, hotelSettings.currencySymbol)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Gross incoming receipts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-start text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Refunds</span>
            <div className="p-1 rounded bg-rose-50 text-rose-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-rose-600">{formatCurrency(totalRefunds, hotelSettings.currencySymbol)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tracked distinctly from revenue</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-start text-slate-500 mb-1">
            <span className="text-xs font-semibold">Net Collections</span>
            <div className="p-1 rounded bg-emerald-50 text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-700">{formatCurrency(netPayments, hotelSettings.currencySymbol)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Collections minus refunds</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-start text-slate-500 mb-1">
            <span className="text-xs font-semibold">Active Outstanding</span>
            <div className="p-1 rounded bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-700">{formatCurrency(metrics.pendingPaymentsTotal, hotelSettings.currencySymbol)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Payable by in-house guests</p>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search txn, booking, guest..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 w-full"
            />
          </div>

          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            className="flex-1 min-w-[120px] sm:flex-initial px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700"
          >
            <option value="All">All Methods</option>
            <option value="UPI">UPI (GPay / PhonePe / QR)</option>
            <option value="Cash">Cash at Desk</option>
            <option value="Card">Debit / Credit Card</option>
            <option value="Bank Transfer">Bank Transfer / NEFT</option>
          </select>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="flex-1 min-w-[120px] sm:flex-initial px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700"
          >
            <option value="All">All Types</option>
            <option value="Advance">Advance Deposit</option>
            <option value="Final">Final Settlement</option>
            <option value="Partial">Partial Payment</option>
            <option value="Refund">Refunds</option>
          </select>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setRecordRefundModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
          >
            <RotateCcw className="w-4 h-4" />
            Refund
          </button>
          <button
            onClick={() => setRecordPaymentModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Transactions Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Reference No.</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => {
                const isRefund = tx.type === 'Refund';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{tx.id}</td>
                    <td className="py-3 px-4 text-slate-500">{tx.createdAt}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{tx.reservationId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{tx.guestName}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{tx.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRefund
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : tx.type === 'Final'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold text-sm ${
                        isRefund ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {isRefund ? '-' : '+'}
                      {formatCurrency(tx.amount, hotelSettings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {tx.referenceNumber || 'Cash/Desk'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenInvoice(tx.reservationId)}
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
                        title="View Full Itemized Tax Invoice"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={recordPaymentModalOpen}
        onClose={() => setRecordPaymentModalOpen(false)}
        title="Record Payment Collection"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Active Reservation *</label>
            <select
              value={payResId}
              onChange={e => setPayResId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              {reservations.map(r => (
                <option key={r.id} value={r.id}>
                  {r.id} — {r.guestName} (Room {r.roomNumber} • Bal: ₹{r.balanceAmount})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Amount ({hotelSettings.currencySymbol}) *</label>
            <input
              type="number"
              min="1"
              value={payAmount}
              onChange={e => setPayAmount(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="UPI">UPI (Google Pay / PhonePe)</option>
                <option value="Cash">Cash at Desk</option>
                <option value="Card">Debit / Credit Card (POS)</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Type</label>
              <select
                value={payType}
                onChange={e => setPayType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Advance">Advance Deposit</option>
                <option value="Final">Final Settlement</option>
                <option value="Partial">Partial Payment</option>
                <option value="Additional Charge">Additional Charge</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">UTR / Reference ID (Optional)</label>
            <input
              type="text"
              placeholder="e.g. UPI/1293819203"
              value={payRef}
              onChange={e => setPayRef(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRecordPaymentModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold"
            >
              Save Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Refund Modal */}
      <Modal
        isOpen={recordRefundModalOpen}
        onClose={() => setRecordRefundModalOpen(false)}
        title="Record Refund to Guest"
        maxWidth="md"
      >
        <form onSubmit={handleRecordRefund} className="space-y-3 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] leading-relaxed">
            <strong>Important Accounting Notice:</strong> Refunds are logged distinctly as outflow adjustments and do not inflate ordinary hotel revenue.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Reservation *</label>
            <select
              value={refundResId}
              onChange={e => setRefundResId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              {reservations.map(r => (
                <option key={r.id} value={r.id}>
                  {r.id} — {r.guestName} (Room {r.roomNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Refund Amount ({hotelSettings.currencySymbol}) *</label>
            <input
              type="number"
              min="1"
              value={refundAmount}
              onChange={e => setRefundAmount(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-rose-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Refund Method</label>
            <select
              value={refundMethod}
              onChange={e => setRefundMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              <option value="UPI">UPI Refund to Original Account</option>
              <option value="Cash">Cash at Desk</option>
              <option value="Bank Transfer">NEFT Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Refund Reference ID</label>
            <input
              type="text"
              value={refundRef}
              onChange={e => setRefundRef(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason / Notes</label>
            <input
              type="text"
              value={refundNotes}
              onChange={e => setRefundNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRecordRefundModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl font-bold"
            >
              Confirm Refund
            </button>
          </div>
        </form>
      </Modal>

      {/* Tax Invoice Modal */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        reservation={selectedResForInvoice}
      />
    </div>
  );
};
