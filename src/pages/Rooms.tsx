import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { Room, RoomStatus, RoomType } from '../types';
import { formatCurrency } from '../lib/utils';
import { RoomStatusBadge } from '../components/ui/Badge';
import {
  Bed,
  Plus,
  Edit,
  Trash2,
  Wrench,
  CheckCircle2,
  Grid,
  List,
  Sparkles,
  Shield,
  Layers,
  IndianRupee,
  Users,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const Rooms: React.FC = () => {
  const {
    rooms,
    roomTypes,
    addRoom,
    updateRoom,
    deleteRoom,
    updateRoomType,
    currentUser,
    hotelSettings,
  } = useHotel();
  const { success, error, warning } = useToast();

  const isOwner = currentUser?.role === 'owner';

  const [activeTab, setActiveTab] = useState<'grid' | 'table' | 'types'>('grid');
  const [selectedFloor, setSelectedFloor] = useState<number | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Modals state
  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [editRoomModalOpen, setEditRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Room Type Edit Modal (Owner only)
  const [editTypeModalOpen, setEditTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);

  // Delete Room State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // New Room Form
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newFloor, setNewFloor] = useState(1);
  const [newRoomTypeId, setNewRoomTypeId] = useState(roomTypes[0]?.id || 'single');

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchFloor = selectedFloor === 'All' || r.floor === selectedFloor;
      const matchStatus = selectedStatus === 'All' || r.status === selectedStatus;
      const matchType = selectedType === 'All' || r.roomTypeId === selectedType;
      return matchFloor && matchStatus && matchType;
    });
  }, [rooms, selectedFloor, selectedStatus, selectedType]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) {
      error('Room number is required.');
      return;
    }

    if (rooms.some(r => r.roomNumber === newRoomNumber.trim())) {
      error(`Room ${newRoomNumber} already exists in hotel inventory.`);
      return;
    }

    addRoom({
      roomNumber: newRoomNumber.trim(),
      roomTypeId: newRoomTypeId,
      floor: Number(newFloor),
      status: 'Available',
      housekeepingStatus: 'Clean',
    });

    success(`Room ${newRoomNumber} added to inventory!`);
    setAddRoomModalOpen(false);
    setNewRoomNumber('');
  };

  const handleSaveRoomEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    updateRoom(editingRoom.id, {
      roomTypeId: editingRoom.roomTypeId,
      floor: editingRoom.floor,
      status: editingRoom.status,
      maintenanceNotes: editingRoom.maintenanceNotes,
    });

    success(`Room ${editingRoom.roomNumber} updated successfully.`);
    setEditRoomModalOpen(false);
  };

  const handleDeleteClick = (r: Room) => {
    if (!isOwner) {
      warning('Only the Hotel Owner can remove rooms from inventory.');
      return;
    }
    setRoomToDelete(r);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!roomToDelete) return;
    const res = deleteRoom(roomToDelete.id);
    if (res.success) {
      success(res.message);
    } else {
      error(res.message);
    }
    setRoomToDelete(null);
  };

  const handleSaveTypeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    if (!isOwner) {
      error('Receptionists cannot alter room pricing or categories.');
      return;
    }

    updateRoomType(editingType.id, {
      name: editingType.name,
      basePrice: Number(editingType.basePrice),
      maxOccupancy: Number(editingType.maxOccupancy),
      extraGuestCharge: Number(editingType.extraGuestCharge),
      description: editingType.description,
    });

    success(`Room type ${editingType.name} updated with rate ₹${editingType.basePrice}/nt!`);
    setEditTypeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Rooms & Room Types Management
          </h2>
          <p className="text-xs text-slate-500">
            {rooms.length} Total Rooms in Inventory • 3 Categories • Floor 1 to Floor 3
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* View Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Room Grid
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table View
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'types'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Room Types & Rates
            </button>
          </div>

          {isOwner && (
            <button
              onClick={() => setAddRoomModalOpen(true)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add Room
            </button>
          )}
        </div>
      </div>

      {/* Grid or Table Filter Bar */}
      {activeTab !== 'types' && (
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-500 text-[11px] uppercase mr-1 w-full sm:w-auto">Filter Inventory:</span>
          {/* Floor */}
          <select
            value={selectedFloor}
            onChange={e => setSelectedFloor(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            className="flex-1 min-w-[130px] sm:flex-initial px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="All">All Floors (1 - 3)</option>
            <option value="1">1st Floor (101 - 110)</option>
            <option value="2">2nd Floor (201 - 210)</option>
            <option value="3">3rd Floor (301 - 305)</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="flex-1 min-w-[130px] sm:flex-initial px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="All">All Room Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Reserved">Reserved</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Out of Service">Out of Service</option>
          </select>

          {/* Room Type */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="flex-1 min-w-[130px] sm:flex-initial px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="All">All Room Classes</option>
            {roomTypes.map(rt => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>

          <span className="w-full sm:w-auto sm:ml-auto text-slate-400 font-medium text-right sm:text-left">
            Showing {filteredRooms.length} of {rooms.length} rooms
          </span>
        </div>
      )}

      {/* Tab 1: Interactive Visual Room Grid */}
      {activeTab === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredRooms.map(rm => {
            const rt = roomTypes.find(t => t.id === rm.roomTypeId);

            const statusColors = {
              Available: 'border-emerald-300 bg-white hover:border-emerald-500 shadow-xs',
              Occupied: 'border-blue-300 bg-blue-50/40 hover:border-blue-500',
              Reserved: 'border-amber-300 bg-amber-50/40 hover:border-amber-500',
              Cleaning: 'border-purple-300 bg-purple-50/40 hover:border-purple-500',
              Maintenance: 'border-rose-300 bg-rose-50/40 hover:border-rose-500',
              'Out of Service': 'border-slate-300 bg-slate-100 hover:border-slate-400',
            }[rm.status];

            return (
              <div
                key={rm.roomNumber}
                className={`p-4 rounded-2xl border transition-all ${statusColors} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-lg font-bold text-slate-900 tracking-tight">
                      Room {rm.roomNumber}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Floor {rm.floor}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 truncate">{rt?.name}</p>
                  <p className="text-[11px] font-bold text-teal-700 mt-0.5">
                    {formatCurrency(rt?.basePrice || 0, hotelSettings.currencySymbol)}
                    <span className="text-[10px] font-normal text-slate-400">/nt</span>
                  </p>

                  <div className="mt-2.5">
                    <RoomStatusBadge status={rm.status} />
                  </div>

                  {rm.currentGuestName && (
                    <div className="mt-2 p-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                      <span className="text-[10px] text-blue-500 uppercase font-bold block">In-House</span>
                      <p className="text-xs font-semibold text-blue-900 truncate">{rm.currentGuestName}</p>
                    </div>
                  )}

                  {rm.maintenanceNotes && (
                    <p className="mt-1.5 text-[10px] text-rose-600 italic line-clamp-2">
                      {rm.maintenanceNotes}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">HK: {rm.housekeepingStatus}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingRoom({ ...rm });
                        setEditRoomModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                      title="Edit Room Status"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteClick(rm)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Inventory Table View */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Room No</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Floor</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Housekeeping</th>
                  <th className="py-3 px-4">Current Guest</th>
                  <th className="py-3 px-4 text-right">Nightly Rate</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map(rm => {
                  const rt = roomTypes.find(t => t.id === rm.roomTypeId);
                  return (
                    <tr key={rm.roomNumber} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">Room {rm.roomNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{rt?.name}</td>
                      <td className="py-3 px-4 text-slate-600">Floor {rm.floor}</td>
                      <td className="py-3 px-4">
                        <RoomStatusBadge status={rm.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rm.housekeepingStatus}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {rm.currentGuestName ? (
                          <span className="font-semibold text-blue-900">{rm.currentGuestName}</span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-teal-800">
                        {formatCurrency(rt?.basePrice || 0, hotelSettings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingRoom({ ...rm });
                              setEditRoomModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-teal-700"
                            title="Edit Room"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => handleDeleteClick(rm)}
                              className="p-1 text-slate-500 hover:text-rose-600"
                              title="Delete Room"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Room Types & Rates Management */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roomTypes.map(rt => {
            const count = rooms.filter(r => r.roomTypeId === rt.id).length;
            return (
              <div
                key={rt.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <img
                    src={rt.image}
                    alt={rt.name}
                    className="w-full h-44 object-cover"
                  />
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-bold text-slate-900">{rt.name}</h3>
                      <span className="text-[10px] font-bold uppercase bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
                        {count} Rooms
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">{rt.description}</p>

                    <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base Nightly Rate:</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(rt.basePrice, hotelSettings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Max Guest Capacity:</span>
                        <span className="font-semibold text-slate-800">{rt.maxOccupancy} Guests</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Extra Guest Surcharge:</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(rt.extraGuestCharge, hotelSettings.currencySymbol)}/night
                        </span>
                      </div>
                    </div>

                    {/* Amenities Pill Tags */}
                    <div className="mt-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Included Amenities:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rt.amenities.map(amenity => (
                          <span
                            key={amenity}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {isOwner ? 'Editable by Owner' : 'Owner permission required to change rates'}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => {
                        setEditingType({ ...rt });
                        setEditTypeModalOpen(true);
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition"
                    >
                      Edit Rate Card
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Room Modal */}
      <Modal isOpen={addRoomModalOpen} onClose={() => setAddRoomModalOpen(false)} title="Add New Room to Inventory" maxWidth="md">
        <form onSubmit={handleCreateRoom} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Room Number *</label>
            <input
              type="text"
              placeholder="e.g. 111 or 211"
              value={newRoomNumber}
              onChange={e => setNewRoomNumber(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Floor Level</label>
            <input
              type="number"
              min="1"
              max="5"
              value={newFloor}
              onChange={e => setNewFloor(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Room Category</label>
            <select
              value={newRoomTypeId}
              onChange={e => setNewRoomTypeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} ({formatCurrency(rt.basePrice, hotelSettings.currencySymbol)}/nt)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddRoomModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold"
            >
              Add Room
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Room Modal */}
      {editingRoom && (
        <Modal
          isOpen={editRoomModalOpen}
          onClose={() => setEditRoomModalOpen(false)}
          title={`Update Room ${editingRoom.roomNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveRoomEdit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room Category</label>
              <select
                value={editingRoom.roomTypeId}
                onChange={e => setEditingRoom({ ...editingRoom, roomTypeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operational Room Status</label>
              <select
                value={editingRoom.status}
                onChange={e => setEditingRoom({ ...editingRoom, status: e.target.value as RoomStatus })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Reserved">Reserved</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maintenance / Repair Notes</label>
              <textarea
                rows={2}
                value={editingRoom.maintenanceNotes || ''}
                onChange={e => setEditingRoom({ ...editingRoom, maintenanceNotes: e.target.value })}
                placeholder="e.g. Geyser thermostat replaced, wall repaint"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditRoomModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold"
              >
                Save Room Updates
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Room Type Rates Modal (Owner Only) */}
      {editingType && (
        <Modal
          isOpen={editTypeModalOpen}
          onClose={() => setEditTypeModalOpen(false)}
          title={`Edit Room Category: ${editingType.name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveTypeEdit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Title</label>
                <input
                  type="text"
                  value={editingType.name}
                  onChange={e => setEditingType({ ...editingType, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nightly Base Rate ({hotelSettings.currencySymbol})
                </label>
                <input
                  type="number"
                  min="100"
                  value={editingType.basePrice}
                  onChange={e => setEditingType({ ...editingType, basePrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Guest Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={editingType.maxOccupancy}
                  onChange={e => setEditingType({ ...editingType, maxOccupancy: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Extra Guest Surcharge</label>
                <input
                  type="number"
                  min="0"
                  value={editingType.extraGuestCharge}
                  onChange={e => setEditingType({ ...editingType, extraGuestCharge: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={editingType.description}
                onChange={e => setEditingType({ ...editingType, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditTypeModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold"
              >
                Save Category & Pricing
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Room Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete Room ${roomToDelete?.roomNumber}?`}
        message={`Are you sure you want to remove Room ${roomToDelete?.roomNumber} from hotel inventory? If there are active reservations or in-house occupants, removal will be prevented.`}
        confirmText="Yes, Delete Room"
        type="danger"
      />
    </div>
  );
};
