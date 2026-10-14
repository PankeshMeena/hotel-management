import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { Reservation, ReservationStatus } from '../types';
import { formatCurrency, formatDate, maskPhoneNumber, exportToExcel } from '../lib/utils';
import { ReservationStatusBadge } from '../components/ui/Badge';
import {
  Search,
  Plus,
  FileSpreadsheet,
  XCircle,
  Eye,
  Edit,
  ArrowUpDown,
} from 'lucide-react';
import { NewReservationModal } from '../components/modals/NewReservationModal';
import { BookingConfirmationModal } from '../components/modals/BookingConfirmationModal';
import { Modal } from '../components/ui/Modal';

export const Reservations: React.FC = () => {
  const { reservations, updateReservation, cancelReservation, checkInReservation, hotelSettings, rooms } = useHotel();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'id' | 'guestName' | 'checkInDate' | 'totalAmount'>('checkInDate');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);

  // Cancel Dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelResId, setCancelResId] = useState<string>('');
  const [cancelReason, setCancelReason] = useState('Guest requested cancellation');

  // Edit Reservation Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);

  // Filter and sort reservations
  const filteredReservations = useMemo(() => {
    return reservations
      .filter(r => {
        const matchesSearch =
          r.guestName.toLowerCase().includes(search.toLowerCase()) ||
          r.id.toLowerCase().includes(search.toLowerCase()) ||
          r.guestMobile.includes(search) ||
          r.roomNumber.includes(search);

        const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
        const matchesSource = sourceFilter === 'All' || r.bookingSource === sourceFilter;

        return matchesSearch && matchesStatus && matchesSource;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [reservations, search, statusFilter, sourceFilter, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredReservations.length / pageSize) || 1;
  const paginatedReservations = filteredReservations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportExcel = () => {
    const exportData = filteredReservations.map((r, idx) => ({
      'S.No': idx + 1,
      'Booking ID': r.id,
      'Guest Name': r.guestName,
      'Mobile': maskPhoneNumber(r.guestMobile),
      'Room Number': r.roomNumber,
      'Check-in Date': r.checkInDate,
      'Check-out Date': r.checkOutDate,
      'Nights': r.numberOfNights,
      'Adults': r.adults,
      'Children': r.children,
      'Source': r.bookingSource,
      'Status': r.status,
      'Total Bill (INR)': r.totalAmount,
      'Advance Paid (INR)': r.advancePaid,
      'Outstanding (INR)': r.balanceAmount,
      'Created Date': r.createdAt,
    }));

    exportToExcel(exportData, `UjjainStay_Reservations_${new Date().toISOString().slice(0, 10)}`, 'Reservations');
    success('Reservations list exported to Excel (.xlsx) successfully!');
  };

  const handleCancelClick = (res: Reservation) => {
    setCancelResId(res.id);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (cancelResId) {
      cancelReservation(cancelResId, cancelReason);
      success(`Reservation ${cancelResId} has been cancelled.`);
      setCancelResId('');
    }
  };

  const handleCheckInClick = (resId: string) => {
    const res = checkInReservation(resId);
    if (res.success) {
      success(res.message, 'Guest Checked In');
    } else {
      error(res.message, 'Check-in Error');
    }
  };

  const handleEditClick = (res: Reservation) => {
    setEditingRes({ ...res });
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRes) return;

    updateReservation(editingRes.id, {
      guestName: editingRes.guestName,
      guestMobile: editingRes.guestMobile,
      roomNumber: editingRes.roomNumber,
      specialRequests: editingRes.specialRequests,
      status: editingRes.status,
    });

    success(`Reservation ${editingRes.id} updated successfully.`);
    setEditModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by guest, ID, phone..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 w-full"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 min-w-[130px] sm:flex-initial px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 font-medium text-slate-700"
          >
            <option value="All">All Statuses ({reservations.length})</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked In">Checked In</option>
            <option value="Checked Out">Checked Out</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No Show">No Show</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={e => {
              setSourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 min-w-[130px] sm:flex-initial px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 font-medium text-slate-700"
          >
            <option value="All">All Channels</option>
            <option value="Direct Walk-in">Direct Walk-in</option>
            <option value="Website">Official Website</option>
            <option value="Phone Call">Phone Call</option>
            <option value="Booking.com">Booking.com</option>
            <option value="MakeMyTrip">MakeMyTrip</option>
            <option value="Agoda">Agoda</option>
          </select>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => setNewBookingModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            New Reservation
          </button>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[10px] uppercase tracking-wider">
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => {
                    setSortField('id');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    Booking ID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => {
                    setSortField('guestName');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    Guest Information <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Room</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => {
                    setSortField('checkInDate');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    Dates & Nights <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                  onClick={() => {
                    setSortField('totalAmount');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Amount <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReservations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No reservations found matching active filters.
                  </td>
                </tr>
              ) : (
                paginatedReservations.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{res.id}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{res.guestName}</p>
                      <p className="text-[11px] text-slate-400">{maskPhoneNumber(res.guestMobile)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Room {res.roomNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>
                        {formatDate(res.checkInDate)} → {formatDate(res.checkOutDate)}
                      </div>
                      <span className="text-[10px] text-slate-400">{res.numberOfNights} Night(s)</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{res.bookingSource}</td>
                    <td className="py-3 px-4">
                      <ReservationStatusBadge status={res.status} />
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {formatCurrency(res.totalAmount, hotelSettings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span className={res.balanceAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                        {formatCurrency(res.balanceAmount, hotelSettings.currencySymbol)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Voucher */}
                        <button
                          onClick={() => {
                            setSelectedRes(res);
                            setVoucherModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition"
                          title="View & Print Voucher"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleEditClick(res)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition"
                          title="Edit Booking"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Fast Check-in if Confirmed/Pending */}
                        {(res.status === 'Confirmed' || res.status === 'Pending') && (
                          <button
                            onClick={() => handleCheckInClick(res.id)}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-2 py-1 rounded text-[11px] transition shadow-xs"
                            title="Check-in guest now"
                          >
                            Check In
                          </button>
                        )}

                        {/* Cancel if not already checked in/out/cancelled */}
                        {(res.status === 'Confirmed' || res.status === 'Pending') && (
                          <button
                            onClick={() => handleCancelClick(res)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                            title="Cancel Reservation"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span>
            Showing {filteredReservations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredReservations.length)} of {filteredReservations.length} bookings
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition"
            >
              Previous
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* New Reservation Modal */}
      <NewReservationModal
        isOpen={newBookingModalOpen}
        onClose={() => setNewBookingModalOpen(false)}
      />

      {/* Confirmation Slip / Voucher Modal */}
      <BookingConfirmationModal
        isOpen={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        reservation={selectedRes}
      />

      {/* Cancel Confirmation Dialog */}
      <Modal
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Cancel Reservation"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to cancel reservation <strong>{cancelResId}</strong>? The assigned room will be immediately released back into available inventory.
          </p>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setCancelDialogOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Keep Booking
            </button>
            <button
              onClick={() => {
                handleConfirmCancel();
                setCancelDialogOpen(false);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold transition"
            >
              Yes, Cancel Booking
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Reservation Modal */}
      {editingRes && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Reservation ${editingRes.id}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Guest Name</label>
              <input
                type="text"
                value={editingRes.guestName}
                onChange={e => setEditingRes({ ...editingRes, guestName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
              <input
                type="tel"
                value={editingRes.guestMobile}
                onChange={e => setEditingRes({ ...editingRes, guestMobile: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Room</label>
              <select
                value={editingRes.roomNumber}
                onChange={e => setEditingRes({ ...editingRes, roomNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                {rooms.map(r => (
                  <option key={r.roomNumber} value={r.roomNumber}>
                    Room {r.roomNumber} ({r.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Booking Status</label>
              <select
                value={editingRes.status}
                onChange={e => setEditingRes({ ...editingRes, status: e.target.value as ReservationStatus })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Checked In">Checked In</option>
                <option value="Checked Out">Checked Out</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Show">No Show</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Special Requests</label>
              <input
                type="text"
                value={editingRes.specialRequests || ''}
                onChange={e => setEditingRes({ ...editingRes, specialRequests: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
