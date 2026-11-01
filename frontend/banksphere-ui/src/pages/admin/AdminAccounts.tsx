import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { Account } from '../../types';
import { Sliders, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';

export const AdminAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAccounts();
      setAccounts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (accountId: string, newStatus: string) => {
    const reason = window.prompt(`Enter compliance reason for changing status to ${newStatus}:`, 'Compliance review');
    if (reason === null) return;

    try {
      setUpdatingId(accountId);
      await adminApi.updateAccountStatus(accountId, newStatus, reason);
      setFeedback(`Account status updated to ${newStatus}.`);
      loadAccounts();
    } catch {
      alert('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
          <Sliders className="w-3.5 h-3.5" />
          <span>Operational Oversight</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Account Controls & Status Management</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Freeze, activate, or close operational bank accounts with administrative audit logging
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-2 shadow-lg">
          <CheckCircle className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Querying system accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Account Number</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Tier</th>
                  <th className="px-6 py-4">Authoritative Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 font-mono font-bold text-white text-base">{a.accountNumber}</td>
                    <td className="px-6 py-4 text-slate-200 font-semibold">{a.customerName}</td>
                    <td className="px-6 py-4 text-xs text-cyan-300 font-medium">{a.accountTypeName}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400 font-mono text-base">
                      ${a.balance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          a.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {a.status === 'Active' ? (
                        <button
                          onClick={() => handleStatusChange(a.id, 'Frozen')}
                          disabled={updatingId === a.id}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition shadow-sm"
                        >
                          Freeze
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(a.id, 'Active')}
                          disabled={updatingId === a.id}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition shadow-sm"
                        >
                          Activate
                        </button>
                      )}

                      {a.status !== 'Closed' && (
                        <button
                          onClick={() => handleStatusChange(a.id, 'Closed')}
                          disabled={updatingId === a.id}
                          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition"
                        >
                          Close
                        </button>
                      )}
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
