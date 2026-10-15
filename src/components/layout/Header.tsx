import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useHotel } from '../../context/HotelContext';
import { useToast } from '../ui/Toast';
import {
  Menu,
  Search,
  Bell,
  Plus,
  UserCheck,
  ChevronDown,
  Clock,
  Sparkles,
  Bed,
  Calendar,
  LogOut,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { formatCurrency, maskPhoneNumber } from '../../lib/utils';

interface HeaderProps {
  collapsed: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenWalkIn?: () => void;
  onOpenNewBooking?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  setMobileOpen,
  onOpenWalkIn,
  onOpenNewBooking,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, login, logout, rooms, reservations, guests, hotelSettings, metrics } = useHotel();
  const { info, success } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute page title and breadcrumb
  const getPageInfo = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return { title: 'Dashboard Overview', subtitle: 'Live front-desk metrics, arrivals, departures & occupancy' };
      case '/reservations':
        return { title: 'Reservation Management', subtitle: 'Search, filter, allocate rooms, and manage booking vouchers' };
      case '/front-desk':
        return { title: 'Front Desk Operations', subtitle: 'Live arrivals, departures, walk-in check-in & ID verification' };
      case '/guests':
        return { title: 'Guest Directory & Folios', subtitle: 'Guest profiles, booking history, verified IDs, and folios' };
      case '/rooms':
        return { title: 'Rooms & Room Types', subtitle: 'Visual floor plan, room inventory, amenities, and rate cards' };
      case '/housekeeping':
        return { title: 'Housekeeping & Maintenance', subtitle: 'Cleaning workflows, room inspections, and maintenance tracking' };
      case '/payments':
        return { title: 'Payments & Transactions', subtitle: 'Track advances, collections, settlements, refunds, and receipts' };
      case '/expenses':
        return { title: 'Hotel Expense Tracker', subtitle: 'Record operational hotel purchases, utility bills, and repairs' };
      case '/reports':
        return { title: 'Reports & Excel Export', subtitle: 'Daily registers, occupancy, revenue summaries, and .xlsx exports' };
      case '/staff':
        return { title: 'Staff Management', subtitle: 'Staff profiles, role privileges, and front-desk assignments' };
      case '/settings':
        return { title: 'Hotel Settings & Policies', subtitle: 'GSTIN, invoice prefixes, check-in rules, and room policies' };
      case '/activity-log':
        return { title: 'System Activity Log', subtitle: 'Comprehensive audit trail of reservations, payments, and edits' };
      default:
        return { title: 'Hotel PMS', subtitle: 'UjjainStay Management System' };
    }
  };

  const pageInfo = getPageInfo();

  // Filter search results across rooms, reservations, guests
  const filteredGuests = searchQuery.trim()
    ? guests.filter(
        g =>
          g.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.mobile.includes(searchQuery) ||
          g.city.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const filteredReservations = searchQuery.trim()
    ? reservations.filter(
        r =>
          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.roomNumber.includes(searchQuery)
      ).slice(0, 3)
    : [];

  const filteredRooms = searchQuery.trim()
    ? rooms.filter(
        r =>
          r.roomNumber.includes(searchQuery) ||
          r.status.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const hasResults =
    filteredGuests.length > 0 || filteredReservations.length > 0 || filteredRooms.length > 0;

  // Demo Switch Role shortcut
  const handleSwitchRole = (targetRole: 'owner' | 'receptionist') => {
    if (targetRole === 'owner') {
      login('owner@ujjainstay.demo', 'Owner@123');
      success('Switched to Owner account (Rajesh Sharma)');
    } else {
      login('reception@ujjainstay.demo', 'Reception@123');
      success('Switched to Receptionist account (Pooja Verma)');
    }
    setShowProfileMenu(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6">
        {/* Left: Mobile trigger & Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 transition shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
              {pageInfo.title}
            </h1>
            <p className="hidden md:block text-xs text-slate-500 truncate">{pageInfo.subtitle}</p>
          </div>
        </div>

        {/* Right: Search, Date, Quick Actions, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition md:hidden"
            aria-label="Search"
            title="Search hotel records"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Desktop Global Search Bar */}
          <div ref={searchRef} className="relative hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search booking, guest, room..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="pl-9 pr-8 py-1.5 text-xs bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-800 rounded-xl border border-transparent focus:border-teal-500 focus:outline-none w-52 lg:w-72 xl:w-80 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Search Dropdown Results */}
            {showSearchResults && searchQuery.trim() && (
              <div className="absolute top-full left-0 mt-1.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-xs">
                {!hasResults ? (
                  <p className="text-slate-500 text-center py-3">No matching records found.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Reservations */}
                    {filteredReservations.length > 0 && (
                      <div>
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                          Bookings
                        </span>
                        {filteredReservations.map(res => (
                          <div
                            key={res.id}
                            onClick={() => {
                              navigate('/reservations');
                              setShowSearchResults(false);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between items-center transition"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">
                                {res.id} — {res.guestName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Room {res.roomNumber} • {res.checkInDate} to {res.checkOutDate}
                              </p>
                            </div>
                            <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-medium">
                              {res.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Guests */}
                    {filteredGuests.length > 0 && (
                      <div className="border-t border-slate-100 pt-2">
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                          Guests
                        </span>
                        {filteredGuests.map(g => (
                          <div
                            key={g.id}
                            onClick={() => {
                              navigate('/reservations');
                              setShowSearchResults(false);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between items-center transition"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">{g.fullName}</p>
                              <p className="text-[11px] text-slate-500">
                                {maskPhoneNumber(g.mobile)} • {g.city}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400">{g.id}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rooms */}
                    {filteredRooms.length > 0 && (
                      <div className="border-t border-slate-100 pt-2">
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                          Rooms
                        </span>
                        {filteredRooms.map(r => (
                          <div
                            key={r.id}
                            onClick={() => {
                              navigate('/rooms');
                              setShowSearchResults(false);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between items-center transition"
                          >
                            <span className="font-semibold text-slate-900">Room {r.roomNumber}</span>
                            <span className="text-[10px] font-medium text-slate-600">
                              Floor {r.floor} • {r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Date & Time Badge (Desktop / Mac) */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs text-slate-700">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-medium">Wed, 14 Oct 2026</span>
            <span className="text-slate-400">•</span>
            <span className="font-semibold text-slate-800">12:00 PM</span>
            <span className="text-slate-400">•</span>
            <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold text-teal-800">
              Ujjain (IST)
            </span>
          </div>

          {/* Quick Walk-in Button */}
          <button
            onClick={() => {
              if (onOpenWalkIn) onOpenWalkIn();
              else navigate('/front-desk');
            }}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition active:scale-95"
            title="Fast walk-in check-in wizard"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Walk-in</span>
            <span className="sm:hidden">Check-in</span>
            <span className="hidden sm:inline">Check-in</span>
          </button>

          {/* Notifications Popover */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {(metrics.todaysCheckIns > 0 || metrics.cleaningRooms > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Front Desk Alerts
                  </h4>
                  <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-medium">
                    Live
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-teal-50/60 border border-teal-100">
                    <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-teal-950">
                        {metrics.todaysCheckIns} Arrivals Today
                      </p>
                      <p className="text-[11px] text-teal-700">Check-in desk opens at 12:00 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-950">
                        {metrics.cleaningRooms} Rooms In Cleaning
                      </p>
                      <p className="text-[11px] text-amber-700">Housekeeping queued after morning checkouts</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                    <Bed className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-950">
                        {metrics.occupancyPercentage}% Occupancy
                      </p>
                      <p className="text-[11px] text-blue-700">{metrics.occupiedRooms} occupied of {metrics.totalRooms} rooms</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile & Role Switcher Menu */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
            >
              <img
                src={
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80'
                }
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover border border-slate-300"
              />
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.name || 'Demo User'}
                </span>
                <span className="block text-[10px] text-teal-600 font-semibold uppercase tracking-wider">
                  {currentUser?.role === 'owner' ? 'Owner' : 'Receptionist'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-2">
                  <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500">{currentUser?.email}</p>
                  <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                    Demo Role: {currentUser?.role}
                  </span>
                </div>

                {/* Quick Role Switcher */}
                <div className="p-2 bg-slate-50 rounded-xl mb-2 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Switch Demo Persona:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleSwitchRole('owner')}
                      className={`text-xs font-semibold py-1.5 px-2 rounded-lg border text-center transition ${
                        currentUser?.role === 'owner'
                          ? 'bg-teal-600 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Owner
                    </button>
                    <button
                      onClick={() => handleSwitchRole('receptionist')}
                      className={`text-xs font-semibold py-1.5 px-2 rounded-lg border text-center transition ${
                        currentUser?.role === 'receptionist'
                          ? 'bg-teal-600 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Receptionist
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-3 py-2 border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2 duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search booking, guest, room..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
              >
                Close
              </button>
            )}
          </div>

          {/* Mobile Search Dropdown Results */}
          {searchQuery.trim() && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 text-xs max-h-60 overflow-y-auto">
              {!hasResults ? (
                <p className="text-slate-500 text-center py-2">No matching records found.</p>
              ) : (
                <div className="space-y-2">
                  {filteredReservations.map(res => (
                    <div
                      key={res.id}
                      onClick={() => {
                        navigate('/reservations');
                        setMobileSearchOpen(false);
                      }}
                      className="p-1.5 hover:bg-slate-50 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{res.id} — {res.guestName}</p>
                        <p className="text-[10px] text-slate-500">Room {res.roomNumber} • {res.checkInDate}</p>
                      </div>
                      <span className="text-[9px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-medium">
                        {res.status}
                      </span>
                    </div>
                  ))}
                  {filteredGuests.map(g => (
                    <div
                      key={g.id}
                      onClick={() => {
                        navigate('/reservations');
                        setMobileSearchOpen(false);
                      }}
                      className="p-1.5 hover:bg-slate-50 rounded-lg flex justify-between items-center"
                    >
                      <p className="font-semibold text-slate-900">{g.fullName}</p>
                      <span className="text-[10px] text-slate-400">{g.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
