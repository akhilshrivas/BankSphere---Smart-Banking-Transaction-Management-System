import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Droplet, Bell, LogOut, X, User, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout, liveNotice, clearLiveNotice } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Live SignalR Alert Banner with water shimmer */}
      {liveNotice && (
        <div className="bg-gradient-to-r from-teal-500/90 via-emerald-600/95 to-cyan-600/90 text-white px-4 py-2 text-xs flex items-center justify-between shadow-lg backdrop-blur-md animate-pulse">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span className="font-semibold tracking-wide">{liveNotice}</span>
            </div>
            <button
              onClick={clearLiveNotice}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo with Water Refraction Glow */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-[0_0_20px_rgba(14,165,233,0.35)] group-hover:shadow-[0_0_30px_rgba(14,165,233,0.6)] transition-all duration-300">
            <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Droplet className="w-5 h-5 text-cyan-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
                BankSphere
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="block text-[10px] text-cyan-400/90 tracking-widest font-semibold uppercase">
              Liquid Ledger Core
            </span>
          </div>
        </Link>

        {/* User Info & Actions */}
        {user ? (
          <div className="flex items-center space-x-3.5">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-100 flex items-center justify-end space-x-1.5">
                <span>{user.firstName} {user.lastName}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user.email}
              </span>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border shadow-sm backdrop-blur-md ${
                user.role === 'Admin'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : user.role === 'Manager'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
              }`}
            >
              {user.role}
            </span>

            <Link
              to="/profile"
              className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 backdrop-blur-md transition shadow-inner"
              title="Account Profile"
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-xs font-semibold rounded-xl border border-white/10 backdrop-blur-md transition shadow-sm"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="relative group px-4 py-2 text-xs font-bold text-white rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)] overflow-hidden transition"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 group-hover:from-blue-500 group-hover:to-cyan-400 transition" />
              <span className="relative z-10 flex items-center space-x-1">
                <span>Open Account</span>
              </span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
