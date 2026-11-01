import React, { useEffect, useState } from 'react';
import { accountApi } from '../services/api';
import { Account } from '../types';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  ArrowDownCircle,
  ShieldCheck,
  Check,
  Sparkles,
  Zap,
  TrendingUp,
  Percent
} from 'lucide-react';

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [initialDeposit, setInitialDeposit] = useState(500);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accRes, typesRes] = await Promise.all([
        accountApi.getAccounts(),
        accountApi.getAccountTypes(),
      ]);
      setAccounts(accRes.data || []);
      setTypes(typesRes.data || []);
      if (typesRes.data?.length > 0) {
        setSelectedType(typesRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await accountApi.createAccount({
        accountTypeId: selectedType,
        currency: 'USD',
        initialDeposit: Number(initialDeposit),
      });
      setAccounts([...accounts, res.data]);
      setModalOpen(false);
      setFeedback(`New account ${res.data.accountNumber} successfully activated!`);
    } catch (err: any) {
      setFeedback(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vault Holdings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Deposit & Checking Accounts</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Authoritative account balances with real-time interest accrual and double-entry reconciliation.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-[0_4px_25px_rgba(14,165,233,0.35)] transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Account</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-2 shadow-lg">
          <Check className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Querying vault accounts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc, index) => {
            const isSavings = acc.accountTypeName.includes('Savings');
            const isBusiness = acc.accountTypeName.includes('Business');

            return (
              <div
                key={acc.id}
                className="glass-panel glass-panel-hover rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl relative overflow-hidden group"
              >
                {/* Water refraction orb */}
                <div
                  className={`absolute -right-10 -bottom-10 w-44 h-44 rounded-full blur-3xl pointer-events-none transition duration-500 ${
                    isSavings
                      ? 'bg-purple-500/15 group-hover:bg-purple-500/25'
                      : isBusiness
                      ? 'bg-emerald-500/15 group-hover:bg-emerald-500/25'
                      : 'bg-cyan-500/15 group-hover:bg-cyan-500/25'
                  }`}
                />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-cyan-400">
                      <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-sm text-slate-100">{acc.accountTypeName}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        acc.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {acc.status}
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Authoritative Ledger Balance
                    </span>
                    <div className="text-3xl font-extrabold text-white tracking-tight font-mono mt-1">
                      ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Account Number:</span>
                      <span className="text-white font-bold">{acc.accountNumber}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Currency:</span>
                      <span className="text-slate-200">{acc.currency}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Ledger Invariant:</span>
                      <span className="text-emerald-400 font-sans font-semibold flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Reconciled 100%</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-6 border-t border-white/10 mt-6 grid grid-cols-2 gap-3">
                  <Link
                    to={`/transfer?source=${acc.id}`}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-xl text-xs font-bold border border-cyan-500/20 transition"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer</span>
                  </Link>
                  <Link
                    to={`/deposit?account=${acc.id}`}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-xs font-bold border border-white/10 transition"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Deposit</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Frosted Glass Open Account Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass-panel border-white/20 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl mirror-water">
            <h2 className="text-xl font-bold text-white">Open Additional Account</h2>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Account Tier / Yield Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (APY: {(t.interestRate * 100).toFixed(2)}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Initial Deposit Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-lg font-bold text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Activating...' : 'Confirm & Open'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
