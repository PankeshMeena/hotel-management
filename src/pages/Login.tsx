import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { useToast } from '../components/ui/Toast';
import { Hotel, Eye, EyeOff, Shield, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useHotel();
  const { success, error } = useToast();

  const [email, setEmail] = useState('owner@ujjainstay.demo');
  const [password, setPassword] = useState('Owner@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setIsLoading(false);

      if (result.success) {
        success(result.message, 'Signed In Successfully');
        navigate('/dashboard');
      } else {
        error(result.message, 'Authentication Failed');
      }
    }, 400);
  };

  const fillCredentials = (role: 'owner' | 'receptionist') => {
    if (role === 'owner') {
      setEmail('owner@ujjainstay.demo');
      setPassword('Owner@123');
    } else {
      setEmail('reception@ujjainstay.demo');
      setPassword('Reception@123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-teal-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="p-8 pb-6 bg-slate-950 text-white text-center border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 mb-3 shadow-inner">
            <Hotel className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">UjjainStay</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cloud Hotel Reception & Front-Desk Management System
          </p>
          <div className="mt-3 inline-block bg-teal-900/60 text-teal-300 border border-teal-700/60 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide">
            Ujjain, Madhya Pradesh
          </div>
        </div>

        {/* Demo Fast Fill Buttons */}
        <div className="px-8 pt-6 pb-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 text-center">
              Quick Demo Logins (Click to Auto-fill)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('owner')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition text-left ${
                  email === 'owner@ujjainstay.demo'
                    ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="block font-bold">Owner / Admin</span>
                <span className="text-[10px] opacity-80 block truncate">Full Privileges</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('receptionist')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition text-left ${
                  email === 'reception@ujjainstay.demo'
                    ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="block font-bold">Receptionist</span>
                <span className="text-[10px] opacity-80 block truncate">Front Desk Only</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="name@ujjainstay.demo"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              Remember for demo
            </label>
            <span className="text-[11px] text-teal-600 font-medium cursor-pointer hover:underline">
              Demo Credentials Available
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold tracking-wide shadow-md shadow-teal-900/20 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-70"
          >
            {isLoading ? (
              'Authenticating...'
            ) : (
              <>
                Sign In to PMS Dashboard <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Demo disclaimer */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <strong>DEMO ONLY:</strong> Client-side demo authentication using local storage. No production credentials or external backend required.
            </p>
          </div>
        </form>
      </div>

      <p className="text-slate-500 text-xs mt-6 text-center">
        &copy; 2026 UjjainStay Demo Hotel • Built for hospitality front-desk excellence
      </p>
    </div>
  );
};
