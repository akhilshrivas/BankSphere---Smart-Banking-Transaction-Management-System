import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { Search, ShieldCheck, Users, Sparkles } from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCustomers();
      setCustomers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.fullName && c.fullName.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.customerNumber && c.customerNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Identity Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Customer Directory</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            KYC verification status, aggregate holdings, and domiciles
          </p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-3xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer name, email, or customer ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
          />
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading customer directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Customer ID</th>
                  <th className="px-6 py-4">Accounts</th>
                  <th className="px-6 py-4">Total Balance</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">KYC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{c.fullName}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-cyan-300 font-bold">
                      {c.customerNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-300">
                      {c.accountsCount} active
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400 font-mono text-base">
                      ${c.totalBalance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {c.city}, {c.country}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{c.kycStatus}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
