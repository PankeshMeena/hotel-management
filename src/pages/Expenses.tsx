import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { formatCurrency, formatDate, exportToExcel } from '../lib/utils';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  PieChart,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const Expenses: React.FC = () => {
  const { expenses, addExpense, deleteExpense, hotelSettings } = useHotel();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // New Expense Form State
  const [date, setDate] = useState('2026-10-14');
  const [category, setCategory] = useState<ExpenseCategory>('Housekeeping');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(1500);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [vendor, setVendor] = useState('');
  const [hasReceipt, setHasReceipt] = useState(true);

  const categories: ExpenseCategory[] = [
    'Housekeeping',
    'Laundry',
    'Repairs',
    'Electricity',
    'Water',
    'Supplies',
    'Staff',
    'Other',
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch =
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        (e.vendor && e.vendor.toLowerCase().includes(search.toLowerCase())) ||
        e.id.toLowerCase().includes(search.toLowerCase());

      const matchCategory = filterCategory === 'All' || e.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [expenses, search, filterCategory]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Breakdown by Category
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      error('Please enter a description and valid amount.');
      return;
    }

    addExpense({
      date,
      category,
      description: description.trim(),
      amount: Number(amount),
      paymentMethod,
      vendor: vendor.trim() || undefined,
      hasReceipt,
    });

    success(`Expense of ₹${amount} recorded under ${category}!`);
    setAddModalOpen(false);
    setDescription('');
    setVendor('');
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete);
      success(`Expense ${expenseToDelete} removed.`);
      setExpenseToDelete(null);
    }
  };

  const handleExportExcel = () => {
    const data = filteredExpenses.map((e, idx) => ({
      'S.No': idx + 1,
      'Expense ID': e.id,
      'Date': e.date,
      'Category': e.category,
      'Description': e.description,
      'Vendor': e.vendor || 'N/A',
      'Amount (INR)': e.amount,
      'Payment Method': e.paymentMethod,
      'Receipt Attached': e.hasReceipt ? 'Yes' : 'No',
      'Recorded By': e.recordedBy,
    }));

    exportToExcel(data, `UjjainStay_Expenses_${new Date().toISOString().slice(0, 10)}`, 'Expenses');
    success('Expense report exported to Excel (.xlsx) successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Category Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Filtered Expenses</span>
          <p className="text-xl font-bold text-rose-600">
            {formatCurrency(totalExpenseAmount, hotelSettings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{filteredExpenses.length} entries</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Housekeeping & Supplies</span>
          <p className="text-xl font-bold text-slate-800">
            {formatCurrency((categoryTotals['Housekeeping'] || 0) + (categoryTotals['Supplies'] || 0), hotelSettings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Toiletries & consumables</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Power & Commercial Utilities</span>
          <p className="text-xl font-bold text-slate-800">
            {formatCurrency((categoryTotals['Electricity'] || 0) + (categoryTotals['Water'] || 0), hotelSettings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">MPEB and water tankers</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Laundry & Repairs</span>
          <p className="text-xl font-bold text-slate-800">
            {formatCurrency((categoryTotals['Laundry'] || 0) + (categoryTotals['Repairs'] || 0), hotelSettings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Linen cleaning & valves</p>
        </div>
      </div>

      {/* Accounting Notice */}
      <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Demo Accounting Disclaimer:</strong> These figures illustrate front-desk expense operations and internal cash outflow tracking. They do not constitute audited tax reports.
          </span>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 w-full"
            />
          </div>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="flex-1 min-w-[130px] sm:flex-initial px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat} ({formatCurrency(categoryTotals[cat] || 0, hotelSettings.currencySymbol)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Expense ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description & Vendor</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Receipt</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{exp.id}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(exp.date)}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{exp.description}</p>
                    {exp.vendor && (
                      <p className="text-[11px] text-slate-400">Vendor: {exp.vendor}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{exp.paymentMethod}</td>
                  <td className="py-3 px-4">
                    {exp.hasReceipt ? (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Attached
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Direct Cash</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-sm text-rose-600">
                    {formatCurrency(exp.amount, hotelSettings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        setExpenseToDelete(exp.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Record Hotel Expense" maxWidth="md">
        <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              placeholder="e.g. 50 Linen bedsheet laundry batch"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Amount ({hotelSettings.currencySymbol}) *
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vendor / Payee</label>
            <input
              type="text"
              placeholder="e.g. Mahakal Star Laundry"
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="hasReceipt"
              checked={hasReceipt}
              onChange={e => setHasReceipt(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="hasReceipt" className="text-slate-600 font-medium">
              Physical or digital tax invoice / receipt attached
            </label>
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
              Record Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Expense Entry"
        message="Are you sure you want to remove this expense record from the ledger?"
        confirmText="Yes, Delete"
        type="danger"
      />
    </div>
  );
};
