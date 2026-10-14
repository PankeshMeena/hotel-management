import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { Staff } from '../types';
import { formatDate, maskPhoneNumber } from '../lib/utils';
import {
  UserCog,
  Plus,
  Edit,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Search,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';

export const StaffPage: React.FC = () => {
  const { staff, addStaff, updateStaff, currentUser, login } = useHotel();
  const { success, warning, error } = useToast();

  const isOwner = currentUser?.role === 'owner';

  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // New staff form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<Staff['role']>('Receptionist');
  const [status, setStatus] = useState<Staff['status']>('Active');
  const [joiningDate, setJoiningDate] = useState('2026-10-14');

  if (!isOwner) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Owner Authorization Required</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
          The Staff Management console is restricted to Hotel Owners and General Managers. Receptionists cannot modify user permissions or staff directories.
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

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      error('Staff name and email are required.');
      return;
    }

    addStaff({
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim() || '+91 98000 00000',
      role,
      status,
      joiningDate,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    });

    success(`Staff member ${name} added!`);
    setAddModalOpen(false);
    setName('');
    setEmail('');
    setMobile('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    updateStaff(editingStaff.id, {
      name: editingStaff.name,
      email: editingStaff.email,
      mobile: editingStaff.mobile,
      role: editingStaff.role,
      status: editingStaff.status,
    });

    success(`Profile for ${editingStaff.name} updated.`);
    setEditModalOpen(false);
  };

  const toggleStatus = (s: Staff) => {
    const nextStatus = s.status === 'Active' ? 'Inactive' : 'Active';
    updateStaff(s.id, { status: nextStatus });
    success(`${s.name} status updated to ${nextStatus}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-teal-600" />
            Staff & Personnel Directory
          </h2>
          <p className="text-xs text-slate-500">
            Hotel owner console for managing front-desk operators, housekeeping crew, and managers
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStaff.map(s => (
          <div
            key={s.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={s.avatar}
                    alt={s.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                        {s.role}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          s.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingStaff({ ...s });
                    setEditModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  title="Edit Staff Profile"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{s.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{maskPhoneNumber(s.mobile)}</span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Joined on {formatDate(s.joiningDate)} • Staff ID: {s.id}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[11px]">System Account</span>
              <button
                onClick={() => toggleStatus(s)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                  s.status === 'Active'
                    ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {s.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Staff Member" maxWidth="md">
        <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sunil Joshi"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="sunil@ujjainstay.demo"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="+91 98260 00000"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Staff['role'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Receptionist">Receptionist</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Manager">Manager</option>
                <option value="Owner">Owner</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Staff['status'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Staff Profile: ${editingStaff.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={editingStaff.name}
                onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={editingStaff.email}
                onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={editingStaff.role}
                  onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value as Staff['role'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Receptionist">Receptionist</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Manager">Manager</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editingStaff.status}
                  onChange={e => setEditingStaff({ ...editingStaff, status: e.target.value as Staff['status'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold"
              >
                Save Profile
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
