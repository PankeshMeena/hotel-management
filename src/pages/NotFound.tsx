import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, ArrowLeft, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mb-4 shadow-sm">
        <Hotel className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-800 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
        The front desk route you are attempting to access does not exist or has been relocated within the UjjainStay PMS.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Go Back
        </button>
        <button
          onClick={() => navigate('/reservations')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs"
        >
          <Home className="w-3.5 h-3.5" /> Return to Reservations
        </button>
      </div>
    </div>
  );
};
