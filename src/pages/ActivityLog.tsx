import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { ActivityLog } from '../types';
import {
  History,
  Search,
  Calendar,
  CreditCard,
  Bed,
  Users,
  Receipt,
  Settings,
  Sparkles,
  Lock,
} from 'lucide-react';

export const ActivityLogPage: React.FC = () => {
  const { activityLogs } = useHotel();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  const entityTypes = [
    'Reservation',
    'Room',
    'Guest',
    'Payment',
    'Expense',
    'Housekeeping',
    'Settings',
    'Staff',
    'Auth',
  ];

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchSearch =
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.entityId.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase());

      const matchType = filterType === 'All' || log.entityType === filterType;
      return matchSearch && matchType;
    });
  }, [activityLogs, search, filterType]);

  const getEntityIcon = (type: ActivityLog['entityType']) => {
    switch (type) {
      case 'Reservation':
        return <Calendar className="w-4 h-4 text-teal-600" />;
      case 'Payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'Room':
        return <Bed className="w-4 h-4 text-blue-600" />;
      case 'Guest':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'Expense':
        return <Receipt className="w-4 h-4 text-rose-600" />;
      case 'Housekeeping':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'Settings':
        return <Settings className="w-4 h-4 text-amber-600" />;
      case 'Auth':
        return <Lock className="w-4 h-4 text-slate-600" />;
      default:
        return <History className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            System Audit Trail & Chronological Activity Log
          </h2>
          <p className="text-xs text-slate-500">
            Immutable log of reservations, check-ins, payments, room maintenance, and hotel setting edits
          </p>
        </div>

        <span className="text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full">
          {activityLogs.length} Events Logged
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action, user, or entity ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 w-full"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="flex-1 min-w-[130px] sm:flex-initial px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700"
          >
            <option value="All">All Operations ({activityLogs.length})</option>
            {entityTypes.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-400 text-[11px]">
          Showing {filteredLogs.length} chronological actions
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              No activity records found matching filters.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-50/80 transition flex items-start gap-3.5 text-xs">
                <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                  {getEntityIcon(log.entityType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">
                        {log.entityType}: {log.entityId}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>

                  <p className="text-slate-700 leading-relaxed font-normal">{log.description}</p>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                    <span>Performed by: <strong className="text-slate-800">{log.userName}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span className="text-teal-700 font-semibold">{log.userRole}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
