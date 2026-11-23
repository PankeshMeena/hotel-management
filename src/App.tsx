import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HotelProvider, useHotel } from './context/HotelContext';
import { ToastProvider } from './components/ui/Toast';
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Reservations } from './pages/Reservations';
import { FrontDesk } from './pages/FrontDesk';
import { Guests } from './pages/Guests';
import { Rooms } from './pages/Rooms';
import { Housekeeping } from './pages/Housekeeping';
import { Payments } from './pages/Payments';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { StaffPage } from './pages/Staff';
import { HotelsPage } from './pages/Hotels';
import { SuperAdminHotels } from './pages/SuperAdminHotels';
import { SettingsPage } from './pages/Settings';
import { ActivityLogPage } from './pages/ActivityLog';
import { NotFound } from './pages/NotFound';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useHotel();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Root index redirect based on role
const RootRedirect: React.FC = () => {
  const { currentUser } = useHotel();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'superadmin') return <Navigate to="/super-admin" replace />;
  return <Navigate to="/reservations" replace />;
};

// Hotel Operational Guard: superadmin is NOT allowed to view operational dashboards/data
const HotelRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useHotel();
  if (currentUser?.role === 'superadmin') {
    return <Navigate to="/super-admin" replace />;
  }
  return <>{children}</>;
};

// Super Admin Guard: ONLY superadmin is allowed to access platform hotel management
const SuperAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useHotel();
  if (currentUser?.role !== 'superadmin') {
    return <Navigate to="/reservations" replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      {/* Protected App Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Super Admin Platform Hotel Management */}
        <Route
          path="/super-admin"
          element={
            <SuperAdminGuard>
              <SuperAdminHotels />
            </SuperAdminGuard>
          }
        />

        {/* Individual Hotel Operational Routes (Owner & Receptionist ONLY) */}
        <Route path="/dashboard" element={<Navigate to="/reservations" replace />} />
        <Route path="/reservations" element={<HotelRouteGuard><Reservations /></HotelRouteGuard>} />
        <Route path="/front-desk" element={<HotelRouteGuard><FrontDesk /></HotelRouteGuard>} />
        <Route path="/guests" element={<Navigate to="/reservations" replace />} />
        <Route path="/rooms" element={<HotelRouteGuard><Rooms /></HotelRouteGuard>} />
        <Route path="/room-types" element={<Navigate to="/rooms" replace />} />
        <Route path="/housekeeping" element={<HotelRouteGuard><Housekeeping /></HotelRouteGuard>} />
        <Route path="/payments" element={<HotelRouteGuard><Payments /></HotelRouteGuard>} />
        <Route path="/expenses" element={<HotelRouteGuard><Expenses /></HotelRouteGuard>} />
        <Route path="/reports" element={<HotelRouteGuard><Reports /></HotelRouteGuard>} />
        <Route path="/staff" element={<HotelRouteGuard><StaffPage /></HotelRouteGuard>} />
        <Route path="/hotels" element={<Navigate to="/super-admin" replace />} />
        <Route path="/settings" element={<HotelRouteGuard><SettingsPage /></HotelRouteGuard>} />
        <Route path="/activity-log" element={<HotelRouteGuard><ActivityLogPage /></HotelRouteGuard>} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export function App() {
  return (
    <ToastProvider>
      <HotelProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </HotelProvider>
    </ToastProvider>
  );
}

export default App;
