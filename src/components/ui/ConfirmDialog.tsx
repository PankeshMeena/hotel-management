import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-4 py-2">
        <div
          className={`shrink-0 rounded-full p-3 ${
            type === 'danger'
              ? 'bg-rose-100 text-rose-600'
              : type === 'warning'
              ? 'bg-amber-100 text-amber-600'
              : 'bg-teal-100 text-teal-600'
          }`}
        >
          {type === 'danger' ? (
            <Trash2 className="h-6 w-6" />
          ) : type === 'warning' ? (
            <AlertTriangle className="h-6 w-6" />
          ) : (
            <CheckCircle2 className="h-6 w-6" />
          )}
        </div>
        <div>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-semibold text-white rounded-xl focus:outline-none focus:ring-2 transition ${
            type === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
              : type === 'warning'
              ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
              : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'
          }`}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};
