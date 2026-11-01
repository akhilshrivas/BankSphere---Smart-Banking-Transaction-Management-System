import React, { useEffect, useState } from 'react';
import { accountApi, transactionApi } from '../services/api';
import { Account, Transaction } from '../types';
import { ArrowUpCircle, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const Withdraw: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>(100);
  const [description, setDescription] = useState<string>('ATM / Counter Cash Withdrawal');
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
      if (res.data?.length > 0) {
        setAccountId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessTx(null);

    if (!amount || Number(amount) <= 0) {
      setError('Please specify a positive withdrawal amount.');
      return;
    }

    if (selectedAccount && Number(amount) > selectedAccount.availableBalance) {
      setError(`Insufficient available balance ($${selectedAccount.availableBalance.toFixed(2)}). Negative balances strictly prevented.`);
      return;
    }

    try {
      setLoading(true);
      const res = await transactionApi.withdraw({
        accountId,
        amount: Number(amount),
        description,
      });
      setSuccessTx(res.data);
      loadAccounts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Withdrawal rejected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Outbound Disbursement</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Withdraw Funds</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Electronic cash disbursements with real-time balance validation & anti-overdraft protection
        </p>
      </div>

      {successTx && (
        <div className="glass-panel border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-3 mirror-water">
          <div className="flex items-center space-x-3 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">Withdrawal Processed</h2>
          </div>
          <p className="text-xs text-slate-300">
            ${successTx.amount.toFixed(2)} was debited. Reference: <span className="font-mono text-emerald-300 font-bold">{successTx.referenceNumber}</span>
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

        <form onSubmit={handleWithdraw} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                From Account
              </label>
              {selectedAccount && (
                <span className="text-xs font-mono font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Available: ${selectedAccount.availableBalance.toFixed(2)}
                </span>
              )}
            </div>
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
              Withdrawal Amount ($)
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
            {/* Presets */}
            <div className="flex gap-2 pt-2">
              {[50, 100, 200, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition"
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Cash Voucher Memo
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
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-95 text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(244,63,94,0.35)] flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>{loading ? 'Disbursing...' : 'Confirm Cash Withdrawal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
