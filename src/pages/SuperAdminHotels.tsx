import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Hotel } from '../types';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Power,
  MapPin,
  Phone,
  Mail,
  Calendar,
  X,
  ShieldCheck,
  Building,
  Check,
  AlertTriangle,
} from 'lucide-react';

export const SuperAdminHotels: React.FC = () => {
  const { hotels, createHotel, updateHotel, toggleHotelStatus, deleteHotel } = useHotel();
  const { success, error, info } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [deletingHotel, setDeletingHotel] = useState<Hotel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Hotel Form State
  const [newHotel, setNewHotel] = useState({
    name: '',
    code: '',
    tagline: 'Comfort & Quality Hospitality',
    city: '',
    state: 'Madhya Pradesh',
    country: 'India',
    address: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    subscriptionPlan: 'Pro' as 'Starter' | 'Pro' | 'Enterprise',
    status: 'Active' as 'Active' | 'Inactive',
    roomsCount: 8,
    ownerName: '',
    ownerEmail: '',
    ownerPassword: 'Owner@123',
  });

  // Calculate Super Admin Dashboard Statistics
  const stats = useMemo(() => {
    const total = hotels.length;
    const active = hotels.filter(h => h.status === 'Active').length;
    const inactive = hotels.filter(h => h.status === 'Inactive' || h.status === 'Trial').length;

    // Recently added in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentlyAdded = hotels.filter(h => {
      if (!h.createdAt) return true;
      const created = new Date(h.createdAt);
      return !isNaN(created.getTime()) ? created >= thirtyDaysAgo : true;
    }).length;

    return {
      totalHotels: total,
      activeHotels: active,
      inactiveHotels: inactive,
      recentlyAdded: recentlyAdded || total,
    };
  }, [hotels]);

  // Filtered Hotels for the Management Table
  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        (h.city && h.city.toLowerCase().includes(q)) ||
        (h.code && h.code.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Active'
          ? h.status === 'Active'
          : h.status === 'Inactive' || h.status === 'Trial';

      return matchesSearch && matchesStatus;
    });
  }, [hotels, searchQuery, statusFilter]);

  // Handle Add Hotel Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotel.name.trim() || !newHotel.city.trim()) {
      error('Please enter hotel name and city.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createHotel({
        ...newHotel,
        ownerName: newHotel.ownerName.trim() || `${newHotel.name} Manager`,
        ownerEmail: newHotel.ownerEmail.trim() || `owner@${newHotel.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.demo`,
      });

      setIsSubmitting(false);
      if (res.success && res.hotel) {
        success(`Hotel "${res.hotel.name}" has been registered successfully!`, 'Hotel Added');
        setIsAddModalOpen(false);
        // Reset form
        setNewHotel({
          name: '',
          code: '',
          tagline: 'Comfort & Quality Hospitality',
          city: '',
          state: 'Madhya Pradesh',
          country: 'India',
          address: '',
          phone: '',
          email: '',
          website: '',
          gstin: '',
          subscriptionPlan: 'Pro',
          status: 'Active',
          roomsCount: 8,
          ownerName: '',
          ownerEmail: '',
          ownerPassword: 'Owner@123',
        });
      } else {
        error(res.message || 'Failed to add hotel.', 'Error');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      error(err.message || 'Error creating hotel record.', 'Error');
    }
  };

  // Handle Edit Hotel Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;

    setIsSubmitting(true);
    try {
      await updateHotel(editingHotel.id, editingHotel);
      setIsSubmitting(false);
      success(`Updated hotel details for "${editingHotel.name}"!`, 'Changes Saved');
      setEditingHotel(null);
    } catch (err: any) {
      setIsSubmitting(false);
      error(err.message || 'Failed to update hotel.', 'Error');
    }
  };

  // Handle Activate / Deactivate Toggle
  const handleToggleStatus = async (hotel: Hotel) => {
    try {
      const res = await toggleHotelStatus(hotel.id);
      if (res.success) {
        success(
          `Hotel "${hotel.name}" is now ${res.status === 'Active' ? 'Active' : 'Inactive'}!`,
          'Status Updated'
        );
      } else {
        error(res.message, 'Failed');
      }
    } catch (err: any) {
      error(err.message || 'Failed to toggle status.', 'Error');
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingHotel) return;
    try {
      const res = await deleteHotel(deletingHotel.id, true);
      if (res.success) {
        success(`Hotel "${deletingHotel.name}" deleted from the platform.`, 'Hotel Deleted');
      } else {
        error(res.message, 'Delete Failed');
      }
    } catch (err: any) {
      error(err.message || 'Error deleting hotel.', 'Error');
    } finally {
      setDeletingHotel(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Add Button Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Hotels Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centralized platform administration. Add, update, activate/deactivate, and monitor all registered hotels.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition active:scale-95 text-xs sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Hotel</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* 1. SUPER ADMIN DASHBOARD STATISTICS (4 Cards) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hotels */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Hotels
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
              {stats.totalHotels}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Registered on platform</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Active Hotels */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Hotels
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block">
              {stats.activeHotels}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Operational & Live</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Inactive Hotels */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Inactive Hotels
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 block">
              {stats.inactiveHotels}
            </span>
            <span className="text-[11px] text-amber-600 font-medium">Suspended or Inactive</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Recently Added Hotels */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Recently Added
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-600 mt-1 block">
              {stats.recentlyAdded}
            </span>
            <span className="text-[11px] text-teal-600 font-medium">Added recently</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. SEARCH & FILTER CONTROLS */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search hotel by name, city, code..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
          {(['All', 'Active', 'Inactive'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. HOTELS MANAGEMENT TABLE */}
      {/* ================================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 sm:px-6">Hotel Name</th>
                <th className="py-3.5 px-4 sm:px-6">Hotel Details</th>
                <th className="py-3.5 px-4 sm:px-6">Registration Date</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No hotels found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or filter.</p>
                  </td>
                </tr>
              ) : (
                filteredHotels.map(h => {
                  const isActive = h.status === 'Active';
                  const regDate = h.createdAt
                    ? new Date(h.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '14 Oct 2026';

                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* Hotel Name */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isActive ? 'bg-teal-50 text-teal-700 border border-teal-200/70' : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {h.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                                {h.code}
                              </span>
                              {h.tagline && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[200px] hidden md:inline">
                                  {h.tagline}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Hotel Details */}
                      <td className="py-4 px-4 sm:px-6 text-slate-600 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{h.city || 'City'}, {h.state || 'India'}</span>
                        </div>
                        {h.address && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {h.address}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                          {h.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {h.phone}
                            </span>
                          )}
                          {h.email && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {h.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 px-4 sm:px-6 text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{regDate}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Plan: <strong className="text-slate-700">{h.subscriptionPlan}</strong>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Activate / Deactivate Toggle Button */}
                          <button
                            onClick={() => handleToggleStatus(h)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                              isActive
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'Deactivate this hotel' : 'Activate this hotel'}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingHotel(h)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                            title="Edit Hotel Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeletingHotel(h)}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition border border-red-200"
                            title="Delete Hotel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ================================================================ */}
      {/* ADD NEW HOTEL MODAL */}
      {/* ================================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add New Hotel</h3>
                  <p className="text-xs text-slate-500">Register a new hotel property on the platform</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hotel Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hotel Radhika Palace"
                    value={newHotel.name}
                    onChange={e => setNewHotel({ ...newHotel, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Varanasi / Jaipur"
                    value={newHotel.city}
                    onChange={e => setNewHotel({ ...newHotel, city: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Madhya Pradesh"
                    value={newHotel.state}
                    onChange={e => setNewHotel({ ...newHotel, state: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Main Market, Station Road"
                    value={newHotel.address}
                    onChange={e => setNewHotel({ ...newHotel, address: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newHotel.phone}
                    onChange={e => setNewHotel({ ...newHotel, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="info@hotel.com"
                    value={newHotel.email}
                    onChange={e => setNewHotel({ ...newHotel, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={newHotel.subscriptionPlan}
                    onChange={e => setNewHotel({ ...newHotel, subscriptionPlan: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newHotel.status}
                    onChange={e => setNewHotel({ ...newHotel, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Initial Owner Account info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Default Owner Account (for hotel login)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Owner Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Hotel Owner"
                      value={newHotel.ownerName}
                      onChange={e => setNewHotel({ ...newHotel, ownerName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Owner Password</label>
                    <input
                      type="text"
                      value={newHotel.ownerPassword}
                      onChange={e => setNewHotel({ ...newHotel, ownerPassword: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering Hotel...' : 'Save & Register Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* EDIT HOTEL MODAL */}
      {/* ================================================================ */}
      {editingHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Edit Hotel: {editingHotel.name}
              </h3>
              <button
                onClick={() => setEditingHotel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Name</label>
                <input
                  type="text"
                  required
                  value={editingHotel.name}
                  onChange={e => setEditingHotel({ ...editingHotel, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editingHotel.city || ''}
                    onChange={e => setEditingHotel({ ...editingHotel, city: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editingHotel.state || ''}
                    onChange={e => setEditingHotel({ ...editingHotel, state: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editingHotel.address || ''}
                  onChange={e => setEditingHotel({ ...editingHotel, address: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingHotel.phone || ''}
                    onChange={e => setEditingHotel({ ...editingHotel, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editingHotel.email || ''}
                    onChange={e => setEditingHotel({ ...editingHotel, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Plan</label>
                  <select
                    value={editingHotel.subscriptionPlan}
                    onChange={e => setEditingHotel({ ...editingHotel, subscriptionPlan: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingHotel.status === 'Active' ? 'Active' : 'Inactive'}
                    onChange={e => setEditingHotel({ ...editingHotel, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingHotel(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ================================================================ */}
      <ConfirmDialog
        isOpen={Boolean(deletingHotel)}
        title="Delete Hotel Property?"
        message={`Are you sure you want to permanently delete "${deletingHotel?.name}" from the platform? This will remove all associated room inventory and data for this property.`}
        confirmText="Yes, Delete Hotel"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingHotel(null)}
      />
    </div>
  );
};
