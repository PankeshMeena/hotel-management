import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { Hotel } from '../types';
import { formatCurrency } from '../lib/utils';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Bed,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Edit,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  X,
  Lock,
  User,
} from 'lucide-react';

export const HotelsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hotels, currentHotel, switchHotel, createHotel, updateHotel, currentUser } = useHotel();
  const { success, error, info } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Trial' | 'Inactive'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Hotel Form State
  const [newHotel, setNewHotel] = useState({
    name: '',
    code: '',
    tagline: 'Experience Comfortable Hospitality',
    city: '',
    state: 'Madhya Pradesh',
    country: 'India',
    address: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    subscriptionPlan: 'Pro' as 'Starter' | 'Pro' | 'Enterprise',
    roomsCount: 8,
    ownerName: '',
    ownerEmail: '',
    ownerPassword: 'Owner@123',
  });

  // Filtered hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.city && h.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        h.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || h.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [hotels, searchQuery, statusFilter]);

  // Platform Aggregate Metrics
  const platformStats = useMemo(() => {
    const totalHotels = hotels.length;
    const totalRooms = hotels.reduce((sum, h) => sum + (h.totalRooms || 0), 0);
    const activeBookings = hotels.reduce((sum, h) => sum + (h.activeBookings || 0), 0);
    const totalRevenue = hotels.reduce((sum, h) => sum + (h.totalRevenue || 0), 0);
    return { totalHotels, totalRooms, activeBookings, totalRevenue };
  }, [hotels]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotel.name || !newHotel.city) {
      error('Please provide hotel name and city.', 'Missing Details');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createHotel({
        ...newHotel,
        ownerName: newHotel.ownerName || `${newHotel.name} Manager`,
        ownerEmail: newHotel.ownerEmail || `owner@${newHotel.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.demo`,
      });

      setIsSubmitting(false);
      if (res.success && res.hotel) {
        success(`Successfully onboarded "${res.hotel.name}" into multi-tenant database!`, 'Property Provisioned');
        setIsCreateModalOpen(false);
        // Reset form
        setNewHotel({
          name: '',
          code: '',
          tagline: 'Experience Comfortable Hospitality',
          city: '',
          state: 'Madhya Pradesh',
          country: 'India',
          address: '',
          phone: '',
          email: '',
          website: '',
          gstin: '',
          subscriptionPlan: 'Pro',
          roomsCount: 8,
          ownerName: '',
          ownerEmail: '',
          ownerPassword: 'Owner@123',
        });
      } else {
        error(res.message, 'Onboarding Failed');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      error(err.message || 'Failed to onboard property.', 'Error');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    setIsSubmitting(true);
    try {
      await updateHotel(editingHotel.id, editingHotel);
      setIsSubmitting(false);
      success(`Updated property details for "${editingHotel.name}"!`, 'Property Updated');
      setEditingHotel(null);
    } catch {
      setIsSubmitting(false);
      error('Failed to update property details.', 'Error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / SaaS Intro */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/60">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span>Multi-Tenant Enterprise Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hotel Properties & Tenants Directory
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Manage multiple independent hotel businesses under one SaaS platform. Each property runs on its own isolated rooms, reservations, staff, and financial ledgers.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg hover:shadow-teal-500/20 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Onboard New Hotel</span>
          </button>
        </div>

        {/* Global Platform Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 sm:p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Hotels
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {platformStats.totalHotels}
              </span>
              <span className="text-xs text-teal-400 font-semibold">Active Tenants</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 sm:p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Platform Rooms
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {platformStats.totalRooms}
              </span>
              <span className="text-xs text-teal-400 font-semibold">Rooms Across Properties</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 sm:p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Bookings
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {platformStats.activeBookings}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">In-house & Confirmed</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 sm:p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Combined Revenue
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {formatCurrency(platformStats.totalRevenue)}
              </span>
              <span className="text-xs text-teal-400 font-semibold">Processed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['All', 'Active', 'Trial', 'Inactive'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHotels.map(h => {
          const isCurrent = currentHotel?.id === h.id;

          return (
            <div
              key={h.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
                isCurrent
                  ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-teal-500/10'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 shadow-xs ${
                        isCurrent
                          ? 'bg-teal-600 text-white'
                          : 'bg-white border border-slate-200 text-teal-700'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900 leading-tight truncate">
                            {h.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{h.city || 'City'}, {h.state || 'India'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                            {h.code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        h.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : h.status === 'Trial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {h.status}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                        {h.subscriptionPlan} Plan
                      </span>
                    </div>
                  </div>

                  {h.tagline && (
                    <p className="text-xs text-slate-500 italic mt-3 line-clamp-1">
                      "{h.tagline}"
                    </p>
                  )}
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 py-3 text-center bg-white">
                  <div className="px-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Rooms</span>
                    <span className="text-sm font-extrabold text-slate-800">{h.totalRooms || 0}</span>
                  </div>
                  <div className="px-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Occupancy</span>
                    <span className="text-sm font-extrabold text-teal-700">{h.occupancyPercent || 0}%</span>
                  </div>
                  <div className="px-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Bookings</span>
                    <span className="text-sm font-extrabold text-slate-800">{h.activeBookings || 0}</span>
                  </div>
                  <div className="px-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Revenue</span>
                    <span className="text-sm font-extrabold text-slate-800 truncate block">
                      {formatCurrency(h.totalRevenue || 0)}
                    </span>
                  </div>
                </div>

                {/* Hotel Contact Details */}
                <div className="p-4 space-y-1.5 text-xs text-slate-600">
                  {h.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{h.phone}</span>
                    </div>
                  )}
                  {h.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{h.email}</span>
                    </div>
                  )}
                  {h.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{h.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-2 border-t border-slate-100 flex items-center gap-2 bg-slate-50/40">
                <button
                  onClick={async () => {
                    await switchHotel(h.id);
                    success(`Switched PMS context to "${h.name}"!`, 'Property Activated');
                    navigate('/reservations');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                    isCurrent
                      ? 'bg-teal-600 text-white shadow-xs hover:bg-teal-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Currently Active (Open PMS)</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Switch & Manage</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setEditingHotel(h)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition border border-slate-200"
                  title="Edit Property Details"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* ONBOARD NEW HOTEL MODAL WIZARD */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Onboard New Hotel Property</h3>
                  <p className="text-xs text-slate-500">Provisions an independent hotel database tenant instantly</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  1. Hotel Property Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hotel Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hotel Radhika Palace"
                      value={newHotel.name}
                      onChange={e => setNewHotel({ ...newHotel, name: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Short Code (e.g. RADHIKA01)
                    </label>
                    <input
                      type="text"
                      placeholder="Auto-generated if empty"
                      value={newHotel.code}
                      onChange={e => setNewHotel({ ...newHotel, code: e.target.value.toUpperCase() })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Varanasi / Jaipur / Bhopal"
                      value={newHotel.city}
                      onChange={e => setNewHotel({ ...newHotel, city: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Uttar Pradesh"
                      value={newHotel.state}
                      onChange={e => setNewHotel({ ...newHotel, state: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dashashwamedh Ghat Road, Varanasi"
                      value={newHotel.address}
                      onChange={e => setNewHotel({ ...newHotel, address: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 00000"
                      value={newHotel.phone}
                      onChange={e => setNewHotel({ ...newHotel, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subscription Plan
                    </label>
                    <select
                      value={newHotel.subscriptionPlan}
                      onChange={e => setNewHotel({ ...newHotel, subscriptionPlan: e.target.value as any })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
                    >
                      <option value="Starter">Starter (Up to 10 Rooms)</option>
                      <option value="Pro">Pro (Up to 30 Rooms)</option>
                      <option value="Enterprise">Enterprise (Unlimited Rooms)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Auto-provisioning parameters */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  2. Starter Rooms & Inventory
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Rooms to Auto-Create
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="30"
                      value={newHotel.roomsCount}
                      onChange={e => setNewHotel({ ...newHotel, roomsCount: Number(e.target.value) })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 flex-1 leading-tight pt-4">
                    Will auto-seed Deluxe, Super Deluxe, and Executive Suite room categories with calibrated pricing and amenities.
                  </p>
                </div>
              </div>

              {/* Step 3: Hotel Owner Login Credentials */}
              <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-200/70">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  3. Hotel Owner Credentials (For Login)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Chandra"
                      value={newHotel.ownerName}
                      onChange={e => setNewHotel({ ...newHotel, ownerName: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Owner Email
                    </label>
                    <input
                      type="email"
                      placeholder="owner@hotel.demo"
                      value={newHotel.ownerEmail}
                      onChange={e => setNewHotel({ ...newHotel, ownerEmail: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      type="text"
                      value={newHotel.ownerPassword}
                      onChange={e => setNewHotel({ ...newHotel, ownerPassword: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-teal-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Provisioning Tenant Database...' : 'Onboard & Provision Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT HOTEL MODAL */}
      {/* ============================================================== */}
      {editingHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Edit Property: {editingHotel.name}
              </h3>
              <button
                onClick={() => setEditingHotel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Name</label>
                <input
                  type="text"
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
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editingHotel.state || ''}
                    onChange={e => setEditingHotel({ ...editingHotel, state: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editingHotel.address || ''}
                  onChange={e => setEditingHotel({ ...editingHotel, address: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
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
                    value={editingHotel.status}
                    onChange={e => setEditingHotel({ ...editingHotel, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
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
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
