import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Users,
  PieChart,
  UserCheck,
  ShieldAlert,
  Sliders,
  Scale,
  FileCheck,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const isAdminOrManager = user.role === 'Admin' || user.role === 'Manager';

  const customerNav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/accounts', label: 'My Accounts', icon: Wallet },
    { to: '/transfer', label: 'Transfer Funds', icon: ArrowRightLeft },
    { to: '/deposit', label: 'Deposit Virtual', icon: ArrowDownCircle },
    { to: '/withdraw', label: 'Withdraw Cash', icon: ArrowUpCircle },
    { to: '/transactions', label: 'Ledger History', icon: History },
    { to: '/beneficiaries', label: 'Beneficiaries', icon: Users },
    { to: '/analytics', label: 'Spending Insights', icon: PieChart },
    { to: '/profile', label: 'Account Profile', icon: UserCheck },
  ];

  const adminNav = [
    { to: '/admin/dashboard', label: 'Admin Telemetry', icon: LayoutDashboard },
    { to: '/admin/customers', label: 'Customer Directory', icon: Users },
    { to: '/admin/accounts', label: 'Account Controls', icon: Sliders },
    { to: '/admin/fraud-alerts', label: 'Fraud Detection AML', icon: ShieldAlert },
    { to: '/admin/reconciliation', label: 'Ledger Reconciliation', icon: Scale },
    { to: '/transactions', label: 'Full Audit Journal', icon: FileCheck },
  ];

  const navItems = isAdminOrManager ? adminNav : customerNav;

  return (
    <aside className="w-64 bg-slate-950/40 backdrop-blur-2xl border-r border-white/10 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-3 flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{isAdminOrManager ? 'Risk & Operations' : 'Core Banking'}</span>
          </span>
          <nav className="mt-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group relative flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/90 to-cyan-500/90 text-white shadow-[0_4px_20px_rgba(14,165,233,0.35)] border border-white/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Water Mirror Specular Box */}
      <div className="glass-panel rounded-2xl p-4 text-xs space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center space-x-2 text-slate-200 font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </span>
          <span className="text-[11px] tracking-wide">Double-Entry Ledger</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Guaranteed mathematical balance. Every cent accounted for with zero synthetic variance.
        </p>
      </div>
    </aside>
  );
};
