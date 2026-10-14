import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useHotel } from '../../context/HotelContext';
import { useToast } from '../ui/Toast';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  LayoutDashboard,
  CalendarDays,
  ConciergeBell,
  Users,
  BedDouble,
  Sparkles,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  UserCog,
  Settings,
  History,
  LogOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Hotel,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { currentUser, logout, hasRole, resetDemoData, hotelSettings } = useHotel();
  const { success } = useToast();
  const navigate = useNavigate();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const isOwner = currentUser?.role === 'owner';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, ownerOnly: false },
    { name: 'Reservations', path: '/reservations', icon: CalendarDays, ownerOnly: false },
    { name: 'Front Desk', path: '/front-desk', icon: ConciergeBell, ownerOnly: false },
    { name: 'Guests', path: '/guests', icon: Users, ownerOnly: false },
    { name: 'Rooms & Types', path: '/rooms', icon: BedDouble, ownerOnly: false },
    { name: 'Housekeeping', path: '/housekeeping', icon: Sparkles, ownerOnly: false },
    { name: 'Payments & Billing', path: '/payments', icon: CreditCard, ownerOnly: false },
    { name: 'Expenses', path: '/expenses', icon: Receipt, ownerOnly: false },
    { name: 'Reports & Export', path: '/reports', icon: FileSpreadsheet, ownerOnly: false },
    { name: 'Staff Management', path: '/staff', icon: UserCog, ownerOnly: true },
    { name: 'Hotel Settings', path: '/settings', icon: Settings, ownerOnly: true },
    { name: 'Activity Log', path: '/activity-log', icon: History, ownerOnly: false },
  ];

  const visibleNavItems = navItems.filter(item => !item.ownerOnly || isOwner);

  const handleResetConfirm = () => {
    resetDemoData();
    success('Demo data restored to original seed state!', 'Reset Complete');
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 border-r border-slate-800 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Hotel className="w-5 h-5 text-teal-400" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                  UjjainStay
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-medium border border-teal-500/30">
                    PMS
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 truncate">Reception & Operations</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role Banner */}
        {!collapsed && currentUser && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-600"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-teal-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  {currentUser.role === 'owner' ? 'Owner / Admin' : 'Receptionist'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30 space-y-1">
          {/* Reset Demo Data button (owner-preferred or quick demo reset) */}
          <button
            onClick={() => setResetDialogOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition"
            title="Restore original seed data"
          >
            <RotateCcw className={`w-4 h-4 shrink-0 text-amber-400 ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && <span>Reset Demo Data</span>}
          </button>

          {/* Logout button */}
          <button
            onClick={() => setLogoutDialogOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
            title="Sign out of demo"
          >
            <LogOut className={`w-4 h-4 shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset Demo Data to Initial Seeds?"
        message="This action will clear all local reservations, guests, bills, and room changes you made and restore the original 25+ demo rooms, guests, and default settings. Proceed?"
        confirmText="Yes, Reset Demo Data"
        type="warning"
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Sign Out"
        message="Are you sure you want to end your current session? You can sign back in anytime as Owner or Receptionist."
        confirmText="Log Out"
        type="info"
      />
    </>
  );
};
