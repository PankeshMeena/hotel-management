import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { HousekeepingTask, HousekeepingStatus, Priority } from '../types';
import { formatDate } from '../lib/utils';
import { HousekeepingBadge, PriorityBadge } from '../components/ui/Badge';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  Plus,
  Play,
  Check,
  AlertTriangle,
  Wrench,
  Search,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';

export const Housekeeping: React.FC = () => {
  const {
    housekeepingTasks,
    createHousekeepingTask,
    updateHousekeepingStatus,
    rooms,
    staff,
  } = useHotel();
  const { success, info } = useToast();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);

  // New task form state
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(rooms[0]?.roomNumber || '101');
  const [selectedStaff, setSelectedStaff] = useState('Ramu Malviya');
  const [priority, setPriority] = useState<Priority>('High');
  const [notes, setNotes] = useState('Post-checkout full room sanitization and linen replacement');

  const filteredTasks = housekeepingTasks.filter(t => {
    const matchSearch =
      t.roomNumber.includes(search) ||
      t.assignedStaff.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = filterStatus === 'All' || t.cleaningStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const dirtyTasks = housekeepingTasks.filter(t => t.cleaningStatus === 'Dirty');
  const inProgressTasks = housekeepingTasks.filter(t => t.cleaningStatus === 'Cleaning in Progress');
  const cleanTasks = housekeepingTasks.filter(t => t.cleaningStatus === 'Clean');
  const inspectedTasks = housekeepingTasks.filter(t => t.cleaningStatus === 'Inspected');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    createHousekeepingTask({
      roomNumber: selectedRoomNumber,
      cleaningStatus: 'Dirty',
      assignedStaff: selectedStaff,
      priority,
      notes,
    });
    success(`Housekeeping task created for Room ${selectedRoomNumber}!`);
    setNewTaskModalOpen(false);
  };

  const handleStatusChange = (taskId: string, newStatus: HousekeepingStatus) => {
    updateHousekeepingStatus(taskId, newStatus);
    success(`Room status updated to ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            Housekeeping & Maintenance Board
          </h2>
          <p className="text-xs text-slate-500">
            Real-time room cleaning workflows, supervisor inspections, and maintenance queue
          </p>
        </div>

        <button
          onClick={() => setNewTaskModalOpen(true)}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Assign Cleaning Task
        </button>
      </div>

      {/* 4 Kanban / Status Pipeline Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Column 1: Dirty */}
        <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col h-full">
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dirty / Queued</h3>
            </div>
            <span className="text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              {dirtyTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
            {dirtyTasks.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs italic">No dirty rooms</p>
            ) : (
              dirtyTasks.map(task => {
                const room = rooms.find(r => r.roomNumber === task.roomNumber);
                return (
                  <div key={task.id} className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900 text-sm">Room {task.roomNumber}</span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{task.notes || 'Routine cleaning'}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                      <span>Staff: <strong>{task.assignedStaff}</strong></span>
                      <span>{task.taskCreationTime.slice(-5)}</span>
                    </div>
                    <button
                      onClick={() => handleStatusChange(task.id, 'Cleaning in Progress')}
                      className="w-full flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1.5 rounded-lg text-xs transition"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Cleaning
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col h-full">
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">In Progress</h3>
            </div>
            <span className="text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
            {inProgressTasks.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs italic">No cleaning in progress</p>
            ) : (
              inProgressTasks.map(task => (
                <div key={task.id} className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 text-sm">Room {task.roomNumber}</span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{task.notes}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                    <span>Staff: <strong>{task.assignedStaff}</strong></span>
                    <span>Started {task.taskCreationTime.slice(-5)}</span>
                  </div>
                  <button
                    onClick={() => handleStatusChange(task.id, 'Clean')}
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 rounded-lg text-xs transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark Cleaned
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Clean (Awaiting Inspection) */}
        <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col h-full">
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Clean / Verify</h3>
            </div>
            <span className="text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              {cleanTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
            {cleanTasks.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs italic">No rooms awaiting inspection</p>
            ) : (
              cleanTasks.map(task => (
                <div key={task.id} className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 text-sm">Room {task.roomNumber}</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Ready for Review
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{task.notes}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                    <span>Cleaned by: <strong>{task.assignedStaff}</strong></span>
                    <span>{task.completionTime?.slice(-5) || 'Just now'}</span>
                  </div>
                  <button
                    onClick={() => handleStatusChange(task.id, 'Inspected')}
                    className="w-full flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1.5 rounded-lg text-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Inspect
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: Inspected (Guest Ready) */}
        <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col h-full">
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inspected & Ready</h3>
            </div>
            <span className="text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              {inspectedTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
            {inspectedTasks.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs italic">No inspected tasks</p>
            ) : (
              inspectedTasks.map(task => (
                <div key={task.id} className="bg-white p-3.5 rounded-xl border border-teal-200 shadow-xs space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-teal-800 text-sm">Room {task.roomNumber}</span>
                    <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Guest Ready
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{task.notes}</p>
                  <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 flex justify-between">
                    <span>Supervisor Verified</span>
                    <span>{task.completionTime || task.taskCreationTime}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={newTaskModalOpen} onClose={() => setNewTaskModalOpen(false)} title="Create Housekeeping Task" maxWidth="md">
        <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Room *</label>
            <select
              value={selectedRoomNumber}
              onChange={e => setSelectedRoomNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              {rooms.map(r => (
                <option key={r.roomNumber} value={r.roomNumber}>
                  Room {r.roomNumber} (Status: {r.status} • HK: {r.housekeepingStatus})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assign Housekeeping Staff</label>
            <select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              {staff
                .filter(s => s.role === 'Housekeeping' || s.role === 'Manager')
                .map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.role})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cleaning Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              <option value="Urgent">Urgent (Immediate Arrival)</option>
              <option value="High">High (Checkout Turnaround)</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cleaning Notes & Checklist</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNewTaskModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold"
            >
              Create Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
