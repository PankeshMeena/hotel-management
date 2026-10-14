import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import {
  Bed,
  DoorOpen,
  CalendarCheck,
  Sparkles,
  Users,
  IndianRupee,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Receipt,
  UserPlus,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, formatDate, maskPhoneNumber } from '../lib/utils';
import { ReservationStatusBadge } from '../components/ui/Badge';
import { WalkInModal } from '../components/modals/WalkInModal';
import { NewReservationModal } from '../components/modals/NewReservationModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { metrics, reservations, checkInReservation, hotelSettings } = useHotel();
  const { success, error } = useToast();

  const [walkInOpen, setWalkInOpen] = useState(false);
  const [newBookingOpen, setNewBookingOpen] = useState(false);

  // Today reference string: 2026-10-14
  const todayStr = '2026-10-14';

  const todaysArrivals = reservations.filter(
    r => r.checkInDate === todayStr && (r.status === 'Confirmed' || r.status === 'Pending')
  );

  const todaysDepartures = reservations.filter(
    r => r.checkOutDate === todayStr && r.status === 'Checked In'
  );

  const recentReservations = reservations.slice(0, 5);

  const handleQuickCheckIn = (resId: string) => {
    const res = checkInReservation(resId);
    if (res.success) {
      success(res.message, 'Check-in Completed');
    } else {
      error(res.message, 'Check-in Failed');
    }
  };

  // 7-day occupancy data for Recharts
  const occupancyData = [
    { day: '08 Oct', occupancy: 48, occupied: 12, available: 13 },
    { day: '09 Oct', occupancy: 56, occupied: 14, available: 11 },
    { day: '10 Oct', occupancy: 64, occupied: 16, available: 9 },
    { day: '11 Oct', occupancy: 60, occupied: 15, available: 10 },
    { day: '12 Oct', occupancy: 68, occupied: 17, available: 8 },
    { day: '13 Oct', occupancy: 72, occupied: 18, available: 7 },
    { day: '14 Oct (Today)', occupancy: metrics.occupancyPercentage, occupied: metrics.occupiedRooms, available: metrics.availableRooms },
  ];

  // 7-day revenue collection vs expenses
  const revenueData = [
    { day: '08 Oct', revenue: 14200, expenses: 3200 },
    { day: '09 Oct', revenue: 18500, expenses: 2150 },
    { day: '10 Oct', revenue: 22400, expenses: 18450 },
    { day: '11 Oct', revenue: 19800, expenses: 1500 },
    { day: '12 Oct', revenue: 26500, expenses: 1950 },
    { day: '13 Oct', revenue: 28900, expenses: 2800 },
    { day: '14 Oct', revenue: metrics.todaysRevenue, expenses: 3450 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Live Hotel Front Desk Operations
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {hotelSettings.name}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Welcome to the central PMS dashboard. Monitor live room occupancy, manage walk-in pilgrims, process departures, and track revenue collections in real time.
            </p>
          </div>

          {/* Primary Quick Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setWalkInOpen(true)}
              className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Walk-in Check-in
            </button>
            <button
              onClick={() => setNewBookingOpen(true)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 rounded-xl text-xs border border-white/20 transition active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              New Reservation
            </button>
            <button
              onClick={() => navigate('/front-desk')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 rounded-xl text-xs border border-white/20 transition active:scale-95"
            >
              <Clock className="w-4 h-4" />
              Process Check-out
            </button>
            <button
              onClick={() => navigate('/payments')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 rounded-xl text-xs border border-white/20 transition active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
            <button
              onClick={() => navigate('/expenses')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 rounded-xl text-xs border border-white/20 transition active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* 10 Calculated Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {/* Total Rooms */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Inventory</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.totalRooms}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across 3 room classes</p>
        </div>

        {/* Available Rooms */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-semibold">Available Rooms</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{metrics.availableRooms}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Ready for immediate check-in</p>
        </div>

        {/* Occupied Rooms */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-semibold">Occupied Rooms</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600">{metrics.occupiedRooms}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{metrics.inHouseGuestsCount} in-house guests</p>
        </div>

        {/* Reserved Rooms */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-semibold">Reserved Rooms</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{metrics.reservedRooms}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Confirmed incoming bookings</p>
        </div>

        {/* Cleaning Rooms */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-semibold">In Housekeeping</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">{metrics.cleaningRooms}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dirty or cleaning tasks</p>
        </div>

        {/* Today's Check-ins */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-semibold">Today's Check-ins</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-teal-700">{metrics.todaysCheckIns}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Expected arrivals today</p>
        </div>

        {/* Today's Check-outs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-semibold">Today's Check-outs</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600">{metrics.todaysCheckOuts}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Expected departures today</p>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-semibold">Today's Collections</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700 truncate">
            {formatCurrency(metrics.todaysRevenue, hotelSettings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Net cash & digital receipts</p>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Balances</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-700 truncate">
            {formatCurrency(metrics.pendingPaymentsTotal, hotelSettings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Payable at checkout</p>
        </div>

        {/* Occupancy % */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-semibold">Occupancy Rate</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700">{metrics.occupancyPercentage}%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, metrics.occupancyPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Two Trend Charts (Occupancy & Revenue) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Occupancy Trend</h3>
              <p className="text-xs text-slate-500">Nightly occupied vs available room ratios</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
              Current: {metrics.occupancyPercentage}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(value: any) => [`${value}% Occupancy`, 'Rate']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="occupancy" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorOcc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue & Expense Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Financial Inflow vs Outflow</h3>
              <p className="text-xs text-slate-500">Gross payment collections compared with expenses</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Today: {formatCurrency(metrics.todaysRevenue, hotelSettings.currencySymbol)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: any) => [formatCurrency(Number(value), hotelSettings.currencySymbol), name === 'revenue' ? 'Revenue' : 'Expense']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="revenue" name="Collections" fill="#0d9488" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Today's Arrivals & Departures Operational Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Arrivals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Today's Arrivals ({todaysArrivals.length})
              </h3>
            </div>
            <button
              onClick={() => navigate('/front-desk')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              View Front Desk →
            </button>
          </div>

          {todaysArrivals.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-teal-500 opacity-60" />
              All today's arrivals have been checked in!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todaysArrivals.map(res => (
                <div key={res.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{res.guestName}</span>
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Room {res.roomNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {res.numberOfNights} night(s) • {maskPhoneNumber(res.guestMobile)} • Source: {res.bookingSource}
                    </p>
                    {res.specialRequests && (
                      <p className="text-[10px] text-amber-700 italic mt-0.5">Note: {res.specialRequests}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-right font-medium text-slate-700 hidden sm:block">
                      {formatCurrency(res.totalAmount, hotelSettings.currencySymbol)}
                    </span>
                    <button
                      onClick={() => handleQuickCheckIn(res.id)}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
                    >
                      Check In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Departures */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Today's Departures ({todaysDepartures.length})
              </h3>
            </div>
            <button
              onClick={() => navigate('/front-desk')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              Checkout Desk →
            </button>
          </div>

          {todaysDepartures.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
              No remaining departures due for today.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todaysDepartures.map(res => (
                <div key={res.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{res.guestName}</span>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Room {res.roomNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Checked in on {formatDate(res.checkInDate)} • {maskPhoneNumber(res.guestMobile)}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Balance: <span className={res.balanceAmount > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                        {formatCurrency(res.balanceAmount, hotelSettings.currencySymbol)}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/front-desk')}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition shadow-xs shrink-0"
                  >
                    Process Checkout
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Reservations Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Booking Activity</h3>
            <p className="text-xs text-slate-500">Latest reservations across direct desk and OTA channels</p>
          </div>
          <button
            onClick={() => navigate('/reservations')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
          >
            All Bookings ({reservations.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50">
                <th className="py-2.5 px-3">Booking ID</th>
                <th className="py-2.5 px-3">Guest Name</th>
                <th className="py-2.5 px-3">Room</th>
                <th className="py-2.5 px-3">Stay Dates</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Total Bill</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentReservations.map(res => (
                <tr key={res.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900">{res.id}</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-800">{res.guestName}</p>
                    <p className="text-[11px] text-slate-400">{maskPhoneNumber(res.guestMobile)}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-teal-700">Room {res.roomNumber}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {formatDate(res.checkInDate)} → {formatDate(res.checkOutDate)}
                    <span className="block text-[10px] text-slate-400">({res.numberOfNights} nights)</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{res.bookingSource}</td>
                  <td className="py-3 px-3">
                    <ReservationStatusBadge status={res.status} />
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-900">
                    {formatCurrency(res.totalAmount, hotelSettings.currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold">
                    <span className={res.balanceAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      {formatCurrency(res.balanceAmount, hotelSettings.currencySymbol)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Modals */}
      <WalkInModal isOpen={walkInOpen} onClose={() => setWalkInOpen(false)} />
      <NewReservationModal isOpen={newBookingOpen} onClose={() => setNewBookingOpen(false)} />
    </div>
  );
};
