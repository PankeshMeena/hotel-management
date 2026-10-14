import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType = 'info', title?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, message, type, title };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const success = (msg: string, title?: string) => addToast(msg, 'success', title || 'Success');
  const error = (msg: string, title?: string) => addToast(msg, 'error', title || 'Error');
  const warning = (msg: string, title?: string) => addToast(msg, 'warning', title || 'Warning');
  const info = (msg: string, title?: string) => addToast(msg, 'info', title || 'Information');

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none no-print">
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border transition-all duration-300 animate-in slide-in-from-bottom-3 ${
                isSuccess
                  ? 'bg-emerald-900/90 text-white border-emerald-700 backdrop-blur-md'
                  : isError
                  ? 'bg-rose-900/90 text-white border-rose-700 backdrop-blur-md'
                  : isWarning
                  ? 'bg-amber-900/90 text-white border-amber-700 backdrop-blur-md'
                  : 'bg-slate-900/90 text-white border-slate-700 backdrop-blur-md'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-300" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-300" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-teal-300" />}
              </div>
              <div className="flex-1 text-sm">
                {t.title && <div className="font-semibold mb-0.5 text-white">{t.title}</div>}
                <div className="text-slate-100 font-normal leading-relaxed">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-300 hover:text-white transition-colors p-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
