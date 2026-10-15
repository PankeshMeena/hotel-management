import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { WalkInModal } from '../modals/WalkInModal';
import { NewReservationModal } from '../modals/NewReservationModal';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Global modals triggered from header or quick actions
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header
          collapsed={collapsed}
          setMobileOpen={setMobileOpen}
          onOpenWalkIn={() => setWalkInModalOpen(true)}
          onOpenNewBooking={() => setNewBookingModalOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 max-w-[1600px] 2xl:max-w-[1850px] w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Smartphones & Tablets < 1024px) */}
      <MobileBottomNav
        onOpenWalkIn={() => setWalkInModalOpen(true)}
        onOpenMenu={() => setMobileOpen(true)}
      />

      {/* Globally Accessible Fast Modals */}
      <WalkInModal
        isOpen={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
      />

      <NewReservationModal
        isOpen={newBookingModalOpen}
        onClose={() => setNewBookingModalOpen(false)}
      />
    </div>
  );
};
