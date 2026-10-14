import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { Guest, IdDocType, VerificationStatus } from '../types';
import { formatCurrency, formatDate, maskPhoneNumber, maskAadhaarNumber, exportToExcel } from '../lib/utils';
import { VerificationBadge } from '../components/ui/Badge';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CreditCard,
  History,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { GuestFolioModal } from '../components/modals/GuestFolioModal';
import { IdPhotoUploader } from '../components/ui/IdPhotoUploader';

export const Guests: React.FC = () => {
  const { guests, addGuest, updateGuest, reservations, hotelSettings } = useHotel();
  const { success, warning, error } = useToast();

  const [search, setSearch] = useState('');
  const [filterVerification, setFilterVerification] = useState<string>('All');
  const [selectedGuestForFolio, setSelectedGuestForFolio] = useState<Guest | null>(null);
  const [folioModalOpen, setFolioModalOpen] = useState(false);

  // Add / Edit Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // New Guest Form
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Madhya Pradesh');
  const [idDocumentType, setIdDocumentType] = useState<IdDocType>('Aadhaar');
  const [idDocumentNumber, setIdDocumentNumber] = useState('•••• •••• 9999');
  const [idVerificationStatus, setIdVerificationStatus] = useState<VerificationStatus>('Verified');
  const [idDocumentPhoto, setIdDocumentPhoto] = useState<string>('');
  const [notes, setNotes] = useState('');

  const filteredGuests = useMemo(() => {
    return guests.filter(g => {
      const matchesSearch =
        g.fullName.toLowerCase().includes(search.toLowerCase()) ||
        g.mobile.includes(search) ||
        g.city.toLowerCase().includes(search.toLowerCase()) ||
        (g.email && g.email.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = filterVerification === 'All' || g.idVerificationStatus === filterVerification;

      return matchesSearch && matchesStatus;
    });
  }, [guests, search, filterVerification]);

  const handlePhoneInput = (val: string) => {
    setMobile(val);
    const exists = guests.some(g => g.mobile.replace(/\s+/g, '') === val.replace(/\s+/g, ''));
    if (exists) {
      warning('A guest with this phone number already exists in your directory.', 'Duplicate Check');
    }
  };

  const handleCreateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobile.trim()) {
      error('Full legal name and phone are required.');
      return;
    }

    const created = addGuest({
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: email.trim() || undefined,
      address: address.trim() || 'Address on file',
      city: city.trim() || 'Ujjain',
      state,
      country: 'India',
      idDocumentType,
      idDocumentNumber,
      idVerificationStatus,
      idDocumentPhoto: idDocumentPhoto || undefined,
      notes,
    });

    success(`Guest profile ${created.id} created for ${created.fullName}!`);
    setAddModalOpen(false);
    // Reset form
    setFullName('');
    setMobile('');
    setEmail('');
    setAddress('');
    setCity('');
    setIdDocumentPhoto('');
    setNotes('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;

    updateGuest(editingGuest.id, {
      fullName: editingGuest.fullName,
      mobile: editingGuest.mobile,
      email: editingGuest.email,
      address: editingGuest.address,
      city: editingGuest.city,
      state: editingGuest.state,
      idDocumentType: editingGuest.idDocumentType,
      idVerificationStatus: editingGuest.idVerificationStatus,
      idDocumentPhoto: editingGuest.idDocumentPhoto,
      notes: editingGuest.notes,
    });

    success(`Guest profile ${editingGuest.id} updated successfully.`);
    setEditModalOpen(false);
  };

  const handleExportExcel = () => {
    const data = filteredGuests.map((g, idx) => ({
      'S.No': idx + 1,
      'Guest ID': g.id,
      'Full Name': g.fullName,
      'Mobile': maskPhoneNumber(g.mobile),
      'Email': g.email || '-',
      'City': g.city,
      'State': g.state,
      'ID Type': g.idDocumentType,
      'ID Verification': g.idVerificationStatus,
      'Total Stays': g.totalStays,
      'Lifetime Spend (INR)': g.totalSpent,
      'Registered Date': g.createdAt,
    }));

    exportToExcel(data, `UjjainStay_Guest_Directory_${new Date().toISOString().slice(0, 10)}`, 'Guests');
    success('Guest directory exported to Excel (.xlsx) successfully!');
  };

  return (
    <div className="space-y-5">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 w-full"
            />
          </div>

          <select
            value={filterVerification}
            onChange={e => setFilterVerification(e.target.value)}
            className="flex-1 min-w-[130px] sm:flex-initial px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 font-medium text-slate-700"
          >
            <option value="All">All ID Statuses</option>
            <option value="Verified">Verified Only</option>
            <option value="Pending">Pending Only</option>
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
            onClick={() => setAddModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Register Guest
          </button>
        </div>
      </div>

      {/* Guests Directory Grid & Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Guest ID</th>
                <th className="py-3 px-4">Full Legal Name</th>
                <th className="py-3 px-4">Contact & Location</th>
                <th className="py-3 px-4">ID Document Type</th>
                <th className="py-3 px-4">ID Status</th>
                <th className="py-3 px-4 text-center">Total Stays</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-center">Folio / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No guest profiles found matching your search.
                  </td>
                </tr>
              ) : (
                filteredGuests.map(guest => {
                  const guestBookings = reservations.filter(r => r.guestId === guest.id);
                  const totalSpent = guestBookings.reduce((sum, r) => sum + r.totalAmount, 0) || guest.totalSpent;

                  return (
                    <tr key={guest.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{guest.id}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{guest.fullName}</p>
                        <p className="text-[11px] text-slate-400">Registered {formatDate(guest.createdAt)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-800 font-medium">{maskPhoneNumber(guest.mobile)}</p>
                        <p className="text-[11px] text-slate-500">{guest.city}, {guest.state}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-medium">{guest.idDocumentType}</span>
                        <span className="block text-[11px] text-slate-400">{maskAadhaarNumber(guest.idDocumentNumber)}</span>
                        {guest.idDocumentPhoto && (
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Scan on file
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <VerificationBadge status={guest.idVerificationStatus} />
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {guestBookings.length || guest.totalStays}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-teal-800">
                        {formatCurrency(totalSpent, hotelSettings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedGuestForFolio(guest);
                              setFolioModalOpen(true);
                            }}
                            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                            title="View Full Stay & Billing History Folio"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            Folio
                          </button>

                          <button
                            onClick={() => {
                              setEditingGuest({ ...guest });
                              setEditModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Edit Profile"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Folio Modal */}
      <GuestFolioModal
        isOpen={folioModalOpen}
        onClose={() => setFolioModalOpen(false)}
        guest={selectedGuestForFolio}
      />

      {/* Add Guest Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register New Guest" maxWidth="2xl">
        <form onSubmit={handleCreateGuest} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alok Nath Sharma"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 98260 12345"
                value={mobile}
                onChange={e => handlePhoneInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="guest@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                placeholder="e.g. Bhopal"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ID Document Type</label>
              <select
                value={idDocumentType}
                onChange={e => setIdDocumentType(e.target.value as IdDocType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Aadhaar">Aadhaar Card (Masked)</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Verification Status</label>
              <select
                value={idVerificationStatus}
                onChange={e => setIdVerificationStatus(e.target.value as VerificationStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Verified">Verified</option>
                <option value="Pending">Pending Physical Verification</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Government Photo ID / Aadhaar Scan
            </label>
            <IdPhotoUploader
              value={idDocumentPhoto}
              onChange={setIdDocumentPhoto}
              documentType={idDocumentType === 'Aadhaar' ? 'Aadhaar Card' : idDocumentType}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Address / Street</label>
            <input
              type="text"
              placeholder="e.g. 102, Civil Lines"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Guest Notes & Preferences</label>
            <textarea
              rows={2}
              placeholder="e.g. Regular Mahakal Bhasma aarti attendee, prefers quiet floor"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold"
            >
              Save Guest Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Guest Modal */}
      {editingGuest && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Profile: ${editingGuest.fullName}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={editingGuest.fullName}
                  onChange={e => setEditingGuest({ ...editingGuest, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={editingGuest.mobile}
                  onChange={e => setEditingGuest({ ...editingGuest, mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={editingGuest.city}
                  onChange={e => setEditingGuest({ ...editingGuest, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ID Verification Status</label>
                <select
                  value={editingGuest.idVerificationStatus}
                  onChange={e => setEditingGuest({ ...editingGuest, idVerificationStatus: e.target.value as VerificationStatus })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Verified">Verified</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Government Photo ID / Aadhaar Scan
              </label>
              <IdPhotoUploader
                value={editingGuest.idDocumentPhoto || ''}
                onChange={(photo) => setEditingGuest({ ...editingGuest, idDocumentPhoto: photo })}
                documentType={editingGuest.idDocumentType === 'Aadhaar' ? 'Aadhaar Card' : editingGuest.idDocumentType}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={editingGuest.notes || ''}
                onChange={e => setEditingGuest({ ...editingGuest, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600"
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
