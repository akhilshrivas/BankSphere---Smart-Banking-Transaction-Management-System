import React, { useEffect, useState } from 'react';
import { accountApi, transactionApi } from '../services/api';
import { Account, Transaction } from '../types';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownCircle, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const Deposit: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>(500);
  const [description, setDescription] = useState<string>('Standard Virtual Demonstration Deposit');
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await accountApi.getAccounts();
      setAccounts(res.data || []);
      const paramAcc = searchParams.get('account');
      if (paramAcc && res.data.some((a) => a.id === paramAcc)) {
        setAccountId(paramAcc);
      } else if (res.data.length > 0) {
        setAccountId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessTx(null);

    if (!amount || Number(amount) <= 0) {
      setError('Please enter a positive deposit amount.');
      return;
    }

    try {
      setLoading(true);
      const res = await transactionApi.deposit({
        accountId,
        amount: Number(amount),
        description,
      });
      setSuccessTx(res.data);
      loadAccounts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Deposit failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Inbound Liquidity Inflow</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Deposit Virtual Currency</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Simulate incoming wire/ACH funds with balanced double-entry ledger allocation
        </p>
      </div>

      {successTx && (
        <div className="glass-panel border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-3 mirror-water">
          <div className="flex items-center space-x-3 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">Deposit Successful</h2>
          </div>
          <p className="text-xs text-slate-300">
            ${successTx.amount.toFixed(2)} was credited to your account. Reference: <span className="font-mono text-emerald-300 font-bold">{successTx.referenceNumber}</span>
          </p>
        </div>
      )}

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleDeposit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Destination Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountTypeName} ({a.accountNumber}) — Balance: ${a.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Deposit Amount ($)
            </label>
            <input
              type="number"
              required
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-4 py-3.5 text-2xl font-bold text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
            />
            {/* Quick amount presets */}
            <div className="flex gap-2 pt-2">
              {[100, 250, 500, 1000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition"
                >
                  +${preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Description / Funding Source
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(16,185,129,0.35)] flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>{loading ? 'Processing Deposit...' : 'Authorize Virtual Funds Deposit'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
