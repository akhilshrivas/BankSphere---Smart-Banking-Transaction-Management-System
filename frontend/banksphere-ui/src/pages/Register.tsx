import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Droplet, Lock, Mail, User, Phone, MapPin, ArrowRight, Sparkles } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    city: '',
    country: 'United States',
    role: 'Customer',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await register({
      ...formData,
      dateOfBirth: new Date('1995-05-15').toISOString(),
    });
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      <div className="absolute w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none -top-10 -right-10" />
      <div className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none -bottom-10 -left-10" />

      <div className="w-full max-w-lg glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 mirror-water border border-white/20">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1px] shadow-[0_0_25px_rgba(14,165,233,0.4)] items-center justify-center mb-2">
            <div className="w-full h-full bg-slate-950/80 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Droplet className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Open BankSphere Account</h1>
          <p className="text-xs text-slate-400">
            Instant checking provisioned with <span className="text-emerald-400 font-bold">$1,000 demonstration bonus</span>
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1 555-0199"
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                City / Municipality
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="New York"
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-[0_4px_25px_rgba(14,165,233,0.35)] flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Opening Account...' : 'Complete Account Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 mt-4">
          Already registered?{' '}
          <Link to="/login" className="text-cyan-400 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
