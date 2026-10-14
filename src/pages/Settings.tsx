import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { HotelSettings } from '../types';
import { formatCurrency } from '../lib/utils';
import {
  Settings,
  Hotel,
  Save,
  RotateCcw,
  Shield,
  ShieldAlert,
  Percent,
  Clock,
  MapPin,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const { hotelSettings, updateHotelSettings, resetDemoData, currentUser, login } = useHotel();
  const { success, warning } = useToast();

  const isOwner = currentUser?.role === 'owner';

  const [form, setForm] = useState<HotelSettings>({ ...hotelSettings });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  if (!isOwner) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Owner Privileges Required</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
          Hotel tax configuration, invoice numbering, policies, and system defaults can only be altered by the Hotel Owner or Administrator.
        </p>
        <button
          onClick={() => {
            login('owner@ujjainstay.demo', 'Owner@123');
            success('Switched to Owner session (Rajesh Sharma)');
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
        >
          Switch to Owner Demo Account
        </button>
      </div>
    );
  }

  const handleSaveConfirmed = () => {
    updateHotelSettings(form);
    success('Hotel profile, tax rules, and operational policies updated successfully!');
  };

  const handleResetConfirmed = () => {
    resetDemoData();
    setForm({ ...hotelSettings });
    success('Demo data restored to original factory seed records!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Hotel Configuration & Policies
          </h2>
          <p className="text-xs text-slate-500">
            Configure hotel address, GSTIN, check-in/out hours, tax slabs, and booking policies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setResetDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Demo Data
          </button>
          <button
            onClick={() => setSaveDialogOpen(true)}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6 text-xs">
        {/* Section 1: Property Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Hotel className="w-4 h-4 text-teal-600" />
            Hotel Profile & Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hotel Legal Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={form.tagline}
                onChange={e => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Full Street Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City, State & Country</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
                <input
                  type="text"
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
                <input
                  type="text"
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Front Desk Phone & Email</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Taxation & Invoicing */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Percent className="w-4 h-4 text-teal-600" />
            Taxation, GSTIN & Invoice Prefixes
          </h3>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
            <strong>Demo Tax Disclaimer:</strong> Configurable tax rates are provided for testing calculation logic. Sample GST configuration is not legally audited advice.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional / Demo)</label>
              <input
                type="text"
                value={form.gstin}
                onChange={e => setForm({ ...form, gstin: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Composite GST Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="28"
                value={form.taxRatePercent}
                onChange={e => setForm({ ...form, taxRatePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={form.invoicePrefix}
                onChange={e => setForm({ ...form, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Check-in Timing & Operating Defaults */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Front Desk Schedule & Guest Tariffs
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Check-in Time</label>
              <input
                type="text"
                value={form.checkInTime}
                onChange={e => setForm({ ...form, checkInTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Check-out Time</label>
              <input
                type="text"
                value={form.checkOutTime}
                onChange={e => setForm({ ...form, checkOutTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Child Nightly Charge (₹)</label>
              <input
                type="number"
                min="0"
                value={form.childCharge}
                onChange={e => setForm({ ...form, childCharge: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Extra Guest Charge (₹)</label>
              <input
                type="number"
                min="0"
                value={form.extraGuestCharge}
                onChange={e => setForm({ ...form, extraGuestCharge: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Policies */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            Cancellation Rules & Hotel Policies
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cancellation Policy</label>
            <textarea
              rows={2}
              value={form.cancellationPolicy}
              onChange={e => setForm({ ...form, cancellationPolicy: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">House Rules & Registration Requirements</label>
            <textarea
              rows={3}
              value={form.hotelPolicies}
              onChange={e => setForm({ ...form, hotelPolicies: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      <ConfirmDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onConfirm={handleSaveConfirmed}
        title="Save Hotel Profile & Configuration?"
        message="Are you sure you want to update hotel parameters? New invoice numbers and tax rules will take effect immediately for front-desk operations."
        confirmText="Save Settings"
        type="info"
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetConfirmed}
        title="Restore Initial Seed Data?"
        message="This action will reset all rooms, reservations, payments, and expenses to the initial 25+ demo seed records. Any local changes will be replaced."
        confirmText="Yes, Restore Seeds"
        type="warning"
      />
    </div>
  );
};
