import React, { useEffect, useState } from 'react';
import { accountApi, beneficiaryApi, transactionApi } from '../services/api';
import { Account, Beneficiary, Transaction } from '../types';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRightLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Sparkles,
  Zap,
  Check
} from 'lucide-react';

export const Transfer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState<string>('');
  const [destAccountNumber, setDestAccountNumber] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState<string>('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => 'IDEMP-' + Math.random().toString(36).substring(2, 10).toUpperCase());
  const [loading, setLoading] = useState(false);
  const [resultTx, setResultTx] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accRes, benRes] = await Promise.all([
        accountApi.getAccounts(),
        beneficiaryApi.getBeneficiaries(),
      ]);
      setAccounts(accRes.data || []);
      setBeneficiaries(benRes.data || []);

      const paramSource = searchParams.get('source');
      const paramDest = searchParams.get('dest');
      if (paramDest) {
        setDestAccountNumber(paramDest);
      }
      if (paramSource && accRes.data.some((a) => a.id === paramSource)) {
        setSourceAccountId(paramSource);
      } else if (accRes.data.length > 0) {
        setSourceAccountId(accRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedSource = accounts.find((a) => a.id === sourceAccountId);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultTx(null);

    if (!amount || Number(amount) <= 0) {
      setError('Please specify a positive transfer amount.');
      return;
    }

    if (selectedSource && Number(amount) > selectedSource.availableBalance) {
      setError(`Insufficient funds in source account. Available balance: $${selectedSource.availableBalance.toFixed(2)}`);
      return;
    }

    try {
      setLoading(true);
      const res = await transactionApi.transfer(
        {
          sourceAccountId,
          destinationAccountNumber: destAccountNumber.trim(),
          amount: Number(amount),
          description: description || 'BankSphere Instant Transfer',
        },
        idempotencyKey
      );

      setResultTx(res.data);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transfer failed. Transaction rolled back atomically.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewIdempotency = () => {
    setIdempotencyKey('IDEMP-' + Math.random().toString(36).substring(2, 10).toUpperCase());
  };

  const setPresetAmount = (val: number) => {
    setAmount(val);
  };

  const setMaxAmount = () => {
    if (selectedSource) {
      setAmount(selectedSource.availableBalance);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Real-Time Settlement Network</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Institutional Money Transfer</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Instant capital movement backed by authoritative double-entry ledger verification.
        </p>
      </div>

      {/* Success Result with Water Glass Bevel */}
      {resultTx && (
        <div className="glass-panel border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 mirror-water">
          <div className="flex items-center space-x-3 text-emerald-400">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Transfer Successfully Settled</h2>
              <span className="text-xs font-mono text-emerald-300">Reference: {resultTx.referenceNumber}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-5 border border-white/10 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span>Settled Amount:</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">${resultTx.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Source Account:</span>
              <span className="text-slate-200">{resultTx.sourceAccountNumber}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Beneficiary Account:</span>
              <span className="text-slate-200">{resultTx.destinationAccountNumber}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Time of Execution (UTC):</span>
              <span className="text-slate-200">{new Date(resultTx.createdAt).toUTCString()}</span>
            </div>
          </div>

          {/* Double-Entry Inspection */}
          {resultTx.ledgerEntries && resultTx.ledgerEntries.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Posted Double-Entry Journal (Zero Imbalance Verified)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {resultTx.ledgerEntries.map((l) => (
                  <div
                    key={l.id}
                    className={`p-4 rounded-2xl border font-mono ${
                      l.entryType === 'Debit'
                        ? 'bg-rose-950/30 border-rose-500/30 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                        : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.1)]'
                    }`}
                  >
                    <div className="flex justify-between font-bold text-sm">
                      <span>{l.entryType.toUpperCase()}</span>
                      <span>${l.amount.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">Account: {l.accountNumber}</div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                      New Balance: ${l.balanceAfter.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                setResultTx(null);
                setAmount('');
                generateNewIdempotency();
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition"
            >
              Start New Transfer
            </button>
          </div>
        </div>
      )}

      {/* Main Transfer Form Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-6">
          {/* Source Account Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Source Account
              </label>
              {selectedSource && (
                <span className="text-xs font-mono font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Available: ${selectedSource.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountTypeName} ({a.accountNumber}) — ${a.balance.toFixed(2)} [{a.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Quick Payee Carousel */}
          {beneficiaries.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Quick Select Saved Counterparty
              </span>
              <div className="flex flex-wrap gap-2">
                {beneficiaries.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setDestAccountNumber(b.accountNumber)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center space-x-1.5 ${
                      destAccountNumber === b.accountNumber
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    <span>{b.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (••••{b.accountNumber.slice(-4)})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipient Account Number */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Recipient Bank Account Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 1020495830"
              value={destAccountNumber}
              onChange={(e) => setDestAccountNumber(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
            />
          </div>

          {/* Amount with Preset Buttons */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Transfer Amount ($)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-2xl font-bold text-slate-400 font-mono">$</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-2xl font-bold text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[50, 100, 250, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPresetAmount(preset)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-medium text-slate-300 transition"
                >
                  ${preset}
                </button>
              ))}
              <button
                type="button"
                onClick={setMaxAmount}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-mono font-bold text-cyan-300 transition"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Payment Memo / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly Rent / Consultancy Fee"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
            />
          </div>

          {/* Idempotency Key Bar */}
          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Idempotency Protection</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px] block">{idempotencyKey}</span>
            </div>
            <button
              type="button"
              onClick={generateNewIdempotency}
              title="Regenerate Key"
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_4px_30px_rgba(14,165,233,0.35)] flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{loading ? 'Executing Atomic Commit...' : 'Authorize & Execute Transfer'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
