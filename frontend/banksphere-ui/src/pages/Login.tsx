import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Droplet, Lock, Mail, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const user = JSON.parse(localStorage.getItem('banksphere_user') || '{}');
      if (user.role === 'Admin' || user.role === 'Manager') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      {/* Refractive Water Glow */}
      <div className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 mirror-water border border-white/20">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1px] shadow-[0_0_25px_rgba(14,165,233,0.4)] items-center justify-center mb-2">
            <div className="w-full h-full bg-slate-950/80 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Droplet className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Sign In to BankSphere</h1>
          <p className="text-xs text-slate-400">Institutional-grade smart banking & double-entry ledger portal</p>
        </div>

        {error && (
          <div className="mt-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-[0_4px_25px_rgba(14,165,233,0.35)] flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Login Pills */}
        <div className="border-t border-white/10 pt-5 mt-6 space-y-2.5">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            One-Click Sandbox Accounts
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemo('john.doe@banksphere.com', 'CustomerPass123!')}
              className="p-3 bg-white/5 hover:bg-white/10 text-slate-200 rounded-2xl border border-white/10 text-left transition group shadow-sm"
            >
              <div className="font-bold text-cyan-300 group-hover:text-cyan-200 flex items-center space-x-1">
                <span>John Doe</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">$75,000 Verified</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@banksphere.com', 'AdminPass123!')}
              className="p-3 bg-white/5 hover:bg-white/10 text-slate-200 rounded-2xl border border-white/10 text-left transition group shadow-sm"
            >
              <div className="font-bold text-rose-400 group-hover:text-rose-300 flex items-center space-x-1">
                <span>Compliance Admin</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Full AML & Controls</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 mt-4">
          Need an account?{' '}
          <Link to="/register" className="text-cyan-400 font-bold hover:underline">
            Open Account with $1,000 Bonus
          </Link>
        </div>
      </div>
    </div>
  );
};
