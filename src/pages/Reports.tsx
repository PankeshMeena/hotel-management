import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { formatCurrency, formatDate, maskPhoneNumber, maskAadhaarNumber, exportToExcel, exportToCsv } from '../lib/utils';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const {
    reservations,
    rooms,
    roomTypes,
    guests,
    transactions,
    expenses,
    housekeepingTasks,
    hotelSettings,
  } = useHotel();
  const { success } = useToast();

  const [selectedReportId, setSelectedReportId] = useState<number>(1);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [reportSearch, setReportSearch] = useState('');

  const reportList = [
    { id: 1, name: 'Daily Guest Arrival Register', category: 'Front Desk' },
    { id: 2, name: 'Daily Departure Register', category: 'Front Desk' },
    { id: 3, name: 'Guest In-House Register', category: 'Front Desk' },
    { id: 4, name: 'Guest History & Frequency', category: 'Guests' },
    { id: 5, name: 'Room Occupancy Report', category: 'Rooms' },
    { id: 6, name: 'Room-wise Revenue Report', category: 'Revenue' },
    { id: 7, name: 'Comprehensive Reservation Report', category: 'Bookings' },
    { id: 8, name: 'Payment Collection Register', category: 'Financials' },
    { id: 9, name: 'Outstanding Payment Ledger', category: 'Financials' },
    { id: 10, name: 'Guest Refund Report', category: 'Financials' },
    { id: 11, name: 'Operating Expense Report', category: 'Expenses' },
    { id: 12, name: 'Daily Financial Summary', category: 'Financials' },
    { id: 13, name: 'Monthly Financial Summary', category: 'Financials' },
    { id: 14, name: 'Cancelled Bookings Report', category: 'Bookings' },
    { id: 15, name: 'Housekeeping Performance Report', category: 'Operations' },
  ];

  // Generate specific dataset for the currently selected report
  const currentReportData = useMemo(() => {
    switch (selectedReportId) {
      case 1: {
        // Daily Guest Arrival Register (matches Form C / Police Station reporting requirement)
        return reservations
          .filter(r => r.checkInDate >= startDate && r.checkInDate <= endDate)
          .map((r, idx) => {
            const g = guests.find(guest => guest.id === r.guestId);
            return {
              'S.No': idx + 1,
              'Booking ID': r.id,
              'Guest Name': r.guestName,
              'Room No': r.roomNumber,
              'Room Category': roomTypes.find(rt => rt.id === r.roomTypeId)?.name || r.roomTypeId,
              'Check-in Date & Time': `${r.checkInDate} ${r.actualCheckInTime || hotelSettings.checkInTime}`,
              'Check-out Date': r.checkOutDate,
              'Guests': `${r.adults}A + ${r.children}C`,
              'ID Verification': g?.idVerificationStatus || 'Verified',
              'Booking Status': r.status,
              'Total Bill': r.totalAmount,
              'Advance Paid': r.advancePaid,
              'Balance': r.balanceAmount,
            };
          });
      }

      case 2: {
        // Daily Departure Register
        return reservations
          .filter(r => r.checkOutDate >= startDate && r.checkOutDate <= endDate)
          .map((r, idx) => ({
            'S.No': idx + 1,
            'Booking ID': r.id,
            'Guest Name': r.guestName,
            'Room No': r.roomNumber,
            'Departure Date': r.checkOutDate,
            'Actual Checkout Time': r.actualCheckOutTime || '-',
            'Nights Stayed': r.numberOfNights,
            'Total Billed': r.totalAmount,
            'Total Paid': r.advancePaid,
            'Final Balance': r.balanceAmount,
            'Status': r.status,
          }));
      }

      case 3: {
        // Guest In-House Register
        return reservations
          .filter(r => r.status === 'Checked In')
          .map((r, idx) => {
            const g = guests.find(guest => guest.id === r.guestId);
            return {
              'S.No': idx + 1,
              'Room No': r.roomNumber,
              'Guest Name': r.guestName,
              'Mobile': maskPhoneNumber(r.guestMobile),
              'City / State': g ? `${g.city}, ${g.state}` : 'On File',
              'Checked In': r.actualCheckInTime || r.checkInDate,
              'Exp. Checkout': r.checkOutDate,
              'Occupants': `${r.adults} Adults, ${r.children} Children`,
              'Balance Due': r.balanceAmount,
            };
          });
      }

      case 4: {
        // Guest History
        return guests.map((g, idx) => ({
          'S.No': idx + 1,
          'Guest ID': g.id,
          'Full Name': g.fullName,
          'Mobile': maskPhoneNumber(g.mobile),
          'City': g.city,
          'ID Document': `${g.idDocumentType} (${maskAadhaarNumber(g.idDocumentNumber)})`,
          'Verification': g.idVerificationStatus,
          'Total Stays': g.totalStays,
          'Lifetime Spend': g.totalSpent,
          'Created Date': g.createdAt,
        }));
      }

      case 5: {
        // Room Occupancy Report
        return rooms.map((rm, idx) => {
          const rt = roomTypes.find(t => t.id === rm.roomTypeId);
          return {
            'S.No': idx + 1,
            'Room Number': rm.roomNumber,
            'Category': rt?.name,
            'Floor': rm.floor,
            'Current Status': rm.status,
            'Housekeeping': rm.housekeepingStatus,
            'Occupant': rm.currentGuestName || 'Vacant',
            'Tariff (INR)': rt?.basePrice,
          };
        });
      }

      case 6: {
        // Room-wise Revenue
        return rooms.map((rm, idx) => {
          const roomBookings = reservations.filter(r => r.roomNumber === rm.roomNumber);
          const revenue = roomBookings.reduce((sum, b) => sum + b.totalAmount, 0);
          return {
            'S.No': idx + 1,
            'Room Number': rm.roomNumber,
            'Category': roomTypes.find(t => t.id === rm.roomTypeId)?.name,
            'Floor': rm.floor,
            'Total Bookings': roomBookings.length,
            'Cumulative Revenue': revenue,
          };
        });
      }

      case 7: {
        // Comprehensive Reservation Report
        return reservations
          .filter(r => r.createdAt.slice(0, 10) >= startDate && r.createdAt.slice(0, 10) <= endDate)
          .map((r, idx) => ({
            'S.No': idx + 1,
            'Booking ID': r.id,
            'Guest Name': r.guestName,
            'Room': r.roomNumber,
            'Check-in': r.checkInDate,
            'Check-out': r.checkOutDate,
            'Nights': r.numberOfNights,
            'Channel': r.bookingSource,
            'Status': r.status,
            'Total': r.totalAmount,
            'Paid': r.advancePaid,
            'Balance': r.balanceAmount,
          }));
      }

      case 8: {
        // Payment Collection Register
        return transactions
          .filter(t => t.createdAt.slice(0, 10) >= startDate && t.createdAt.slice(0, 10) <= endDate && t.type !== 'Refund')
          .map((t, idx) => ({
            'S.No': idx + 1,
            'Txn ID': t.id,
            'Date': t.createdAt,
            'Booking ID': t.reservationId,
            'Guest': t.guestName,
            'Method': t.paymentMethod,
            'Type': t.type,
            'Amount Collected': t.amount,
            'Reference': t.referenceNumber || 'Desk',
            'Recorded By': t.recordedBy,
          }));
      }

      case 9: {
        // Outstanding Payment Ledger
        return reservations
          .filter(r => r.balanceAmount > 0 && r.status !== 'Cancelled')
          .map((r, idx) => ({
            'S.No': idx + 1,
            'Booking ID': r.id,
            'Guest Name': r.guestName,
            'Mobile': maskPhoneNumber(r.guestMobile),
            'Room': r.roomNumber,
            'Check-out Date': r.checkOutDate,
            'Status': r.status,
            'Total Bill': r.totalAmount,
            'Paid': r.advancePaid,
            'Outstanding Due': r.balanceAmount,
          }));
      }

      case 10: {
        // Refund Report
        return transactions
          .filter(t => t.type === 'Refund')
          .map((t, idx) => ({
            'S.No': idx + 1,
            'Refund ID': t.id,
            'Date': t.createdAt,
            'Booking ID': t.reservationId,
            'Guest Name': t.guestName,
            'Method': t.paymentMethod,
            'Refund Amount': t.amount,
            'Reference': t.referenceNumber || '-',
            'Recorded By': t.recordedBy,
          }));
      }

      case 11: {
        // Operating Expense Report
        return expenses
          .filter(e => e.date >= startDate && e.date <= endDate)
          .map((e, idx) => ({
            'S.No': idx + 1,
            'Expense ID': e.id,
            'Date': e.date,
            'Category': e.category,
            'Description': e.description,
            'Vendor': e.vendor || '-',
            'Amount': e.amount,
            'Method': e.paymentMethod,
            'Receipt': e.hasReceipt ? 'Yes' : 'No',
          }));
      }

      case 12: {
        // Daily Financial Summary
        const todayCollections = transactions
          .filter(t => t.createdAt.startsWith('2026-10-14') && t.type !== 'Refund')
          .reduce((s, t) => s + t.amount, 0);
        const todayRefunds = transactions
          .filter(t => t.createdAt.startsWith('2026-10-14') && t.type === 'Refund')
          .reduce((s, t) => s + t.amount, 0);
        const todayExp = expenses
          .filter(e => e.date === '2026-10-14')
          .reduce((s, e) => s + e.amount, 0);

        return [
          { 'Metric Description': "Gross Today's Collections", 'Amount (INR)': todayCollections, 'Notes': 'Desk & UPI cash receipts' },
          { 'Metric Description': "Today's Issued Refunds", 'Amount (INR)': todayRefunds, 'Notes': 'Cancelled advance payouts' },
          { 'Metric Description': "Net Today's Collections", 'Amount (INR)': todayCollections - todayRefunds, 'Notes': 'Receipts minus refunds' },
          { 'Metric Description': "Today's Operating Expenses", 'Amount (INR)': todayExp, 'Notes': 'Housekeeping & laundry outlays' },
          { 'Metric Description': 'Net Operational Balance', 'Amount (INR)': (todayCollections - todayRefunds) - todayExp, 'Notes': 'Demo day cash surplus' },
        ];
      }

      case 13: {
        // Monthly Financial Summary
        const monthCollections = transactions.filter(t => t.type !== 'Refund').reduce((s, t) => s + t.amount, 0);
        const monthRefunds = transactions.filter(t => t.type === 'Refund').reduce((s, t) => s + t.amount, 0);
        const monthExp = expenses.reduce((s, e) => s + e.amount, 0);

        return [
          { 'Account Summary Item': 'Gross Monthly Collections', 'Amount (INR)': monthCollections, 'Classification': 'Operating Receipts' },
          { 'Account Summary Item': 'Gross Monthly Refunds', 'Amount (INR)': monthRefunds, 'Classification': 'Adjustments' },
          { 'Account Summary Item': 'Net Collections', 'Amount (INR)': monthCollections - monthRefunds, 'Classification': 'Operating Revenue' },
          { 'Account Summary Item': 'Total Operating Expenses', 'Amount (INR)': monthExp, 'Classification': 'Operating Costs' },
          { 'Account Summary Item': 'Net Operational Margin', 'Amount (INR)': (monthCollections - monthRefunds) - monthExp, 'Classification': 'Net Margin (Demo)' },
        ];
      }

      case 14: {
        // Cancelled Bookings
        return reservations
          .filter(r => r.status === 'Cancelled' || r.status === 'No Show')
          .map((r, idx) => ({
            'S.No': idx + 1,
            'Booking ID': r.id,
            'Guest Name': r.guestName,
            'Mobile': maskPhoneNumber(r.guestMobile),
            'Room': r.roomNumber,
            'Stay Dates': `${r.checkInDate} to ${r.checkOutDate}`,
            'Status': r.status,
            'Reason': r.cancellationReason || 'No reason provided',
            'Cancelled Amount': r.totalAmount,
          }));
      }

      case 15: {
        // Housekeeping Report
        return housekeepingTasks.map((h, idx) => ({
          'S.No': idx + 1,
          'Task ID': h.id,
          'Room Number': h.roomNumber,
          'Assigned Staff': h.assignedStaff,
          'Status': h.cleaningStatus,
          'Priority': h.priority,
          'Created Time': h.taskCreationTime,
          'Completion Time': h.completionTime || 'In Progress',
          'Notes': h.notes || '-',
        }));
      }

      default:
        return [];
    }
  }, [selectedReportId, reservations, rooms, roomTypes, guests, transactions, expenses, housekeepingTasks, startDate, endDate, hotelSettings]);

  const selectedReport = reportList.find(r => r.id === selectedReportId) || reportList[0];

  // Filter report data by search term if provided
  const filteredData = useMemo(() => {
    if (!reportSearch.trim()) return currentReportData;
    const term = reportSearch.toLowerCase();
    return currentReportData.filter(row =>
      Object.values(row).some(val => String(val).toLowerCase().includes(term))
    );
  }, [currentReportData, reportSearch]);

  const handleExportExcel = () => {
    const fileName = `UjjainStay_${selectedReport.name.replace(/\s+/g, '_')}_${startDate}_to_${endDate}`;
    const ok = exportToExcel(filteredData, fileName, selectedReport.name);
    if (ok) {
      success(`Exported ${filteredData.length} records to Excel (.xlsx)!`);
    }
  };

  const handleExportCsv = () => {
    const fileName = `UjjainStay_${selectedReport.name.replace(/\s+/g, '_')}_${startDate}_to_${endDate}`;
    exportToCsv(filteredData, fileName);
    success(`Exported ${filteredData.length} records to CSV!`);
  };

  const handlePrint = () => {
    window.print();
  };

  const headers = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-600" />
            Hospitality Reports & Genuine Excel Export
          </h2>
          <p className="text-xs text-slate-500">
            Export authentic .xlsx spreadsheets via SheetJS with formatted currency and sanitized identity records
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Mobile Report Selector Dropdown */}
      <div className="lg:hidden bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Select Active Report:
        </label>
        <select
          value={selectedReportId}
          onChange={e => setSelectedReportId(Number(e.target.value))}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
        >
          {reportList.map(r => (
            <option key={r.id} value={r.id}>
              #{r.id} {r.name} ({r.category})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: 15 Reports Selector (Desktop & Mac) */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-1 max-h-[750px] overflow-y-auto">
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block px-2 mb-2">
            Standard PMS Reports (15)
          </span>
          {reportList.map(r => {
            const isSelected = r.id === selectedReportId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedReportId(r.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="truncate pr-2">
                  <span className="block truncate">{r.name}</span>
                  <span className={`text-[10px] font-normal block ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                    {r.category}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  #{r.id}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Date Range Filter, Search, and Live Data Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-600">Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
              />
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search filtered records..."
                value={reportSearch}
                onChange={e => setReportSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl w-48 sm:w-56"
              />
            </div>
          </div>

          {/* Active Report Header Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{selectedReport.name}</h3>
              <p className="text-slate-500 text-[11px]">
                Showing {filteredData.length} records • Period: {formatDate(startDate)} to {formatDate(endDate)}
              </p>
            </div>
            <span className="bg-teal-50 text-teal-800 font-bold px-3 py-1 rounded-full border border-teal-200 text-xs">
              Live Filtered Preview
            </span>
          </div>

          {/* Table Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    {headers.map(h => (
                      <th key={h} className="py-2.5 px-3 whitespace-nowrap bg-slate-50">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length || 1} className="py-12 text-center text-slate-400">
                        No records match the selected date range and search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        {headers.map(h => {
                          const val = (row as any)[h];
                          const isAmount = typeof val === 'number' && (h.includes('Bill') || h.includes('Amount') || h.includes('Paid') || h.includes('Balance') || h.includes('Revenue') || h.includes('Spend') || h.includes('Tariff'));
                          return (
                            <td key={h} className={`py-2.5 px-3 whitespace-nowrap ${isAmount ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                              {isAmount ? formatCurrency(val, hotelSettings.currencySymbol) : String(val ?? '-')}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
