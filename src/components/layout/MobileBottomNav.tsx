import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  ConciergeBell,
  BedDouble,
  Users,
  Plus,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenWalkIn: () => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenWalkIn,
  onOpenMenu,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg lg:hidden no-print safe-bottom"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-15 px-2 max-w-md mx-auto">
        {/* Reservations */}
        <NavLink
          to="/reservations"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition ${
              isActive ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-teal-50' : ''}`}>
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="mt-0.5 tracking-tight">Bookings</span>
            </>
          )}
        </NavLink>

        {/* Front Desk */}
        <NavLink
          to="/front-desk"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition ${
              isActive ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-teal-50' : ''}`}>
                <ConciergeBell className="w-5 h-5" />
              </div>
              <span className="mt-0.5 tracking-tight">Desk</span>
            </>
          )}
        </NavLink>

        {/* Center Floating Action: Walk-in Check-in */}
        <div className="flex flex-col items-center justify-center px-1">
          <button
            onClick={onOpenWalkIn}
            className="w-11 h-11 -mt-4 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-700/30 flex items-center justify-center active:scale-95 transition"
            aria-label="Quick Walk-in Check-in"
            title="Fast Walk-in Check-in"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-bold text-teal-800 mt-1">Walk-in</span>
        </div>

        {/* Rooms Grid */}
        <NavLink
          to="/rooms"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition ${
              isActive ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-teal-50' : ''}`}>
                <BedDouble className="w-5 h-5" />
              </div>
              <span className="mt-0.5 tracking-tight">Rooms</span>
            </>
          )}
        </NavLink>

        {/* Menu (More) */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-900 transition"
          aria-label="Open More Navigation Options"
        >
          <div className="p-1 rounded-xl">
            <Menu className="w-5 h-5" />
          </div>
          <span className="mt-0.5 tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};
