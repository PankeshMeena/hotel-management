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

// Root index redirect
const RootRedirect: React.FC = () => {
  const { currentUser } = useHotel();
  return currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/front-desk" element={<FrontDesk />} />
        <Route path="/guests" element={<Guests />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/room-types" element={<Rooms />} />
        <Route path="/housekeeping" element={<Housekeeping />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/activity-log" element={<ActivityLogPage />} />
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
