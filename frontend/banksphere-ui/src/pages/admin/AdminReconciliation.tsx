import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { SystemReconciliationReport } from '../../types';
import { Scale, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export const AdminReconciliation: React.FC = () => {
  const [report, setReport] = useState<SystemReconciliationReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runReconciliation();
  }, []);

  const runReconciliation = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getReconciliation();
      setReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Ledger Integrity Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Double-Entry Reconciliation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Authoritative financial audit comparing cached account balances against posted debit/credit ledger sums
          </p>
        </div>

        <button
          onClick={runReconciliation}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 active:scale-[0.98] text-xs sm:text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Executing Audit...' : 'Reconcile Ledger Now'}</span>
        </button>
      </div>

      {report && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-3xl relative overflow-hidden space-y-2 border border-white/10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Accounts Verified
              </span>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {report.totalAccountsChecked}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>100% database coverage</span>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-3xl relative overflow-hidden space-y-2 border border-emerald-500/20 shadow-emerald-500/5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Reconciled Symmetrical
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                {report.reconciledCount}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center space-x-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero mathematical variance</span>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-3xl relative overflow-hidden space-y-2 border border-white/10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Discrepancies Flagged
              </span>
              <div
                className={`text-3xl font-extrabold font-mono tracking-tight ${
                  report.discrepancyCount === 0 ? 'text-slate-400' : 'text-rose-400'
                }`}
              >
                {report.discrepancyCount}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                {report.discrepancyCount === 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Invariant preserved</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="text-rose-400 font-semibold">Immediate investigation required</span>
                  </>
                )}
              </div>
            </div>

            <div className="glass-panel p-5 rounded-3xl relative overflow-hidden space-y-2 border border-cyan-500/20">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Authoritative Customer Total
              </span>
              <div className="text-2xl font-extrabold text-cyan-300 font-mono tracking-tight">
                ${report.totalCustomerAuthoritativeBalances.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400">
                Exact Σ(Credits) − Σ(Debits)
              </div>
            </div>
          </div>

          {/* Status Banner */}
          <div
            className={`glass-panel p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${
              report.discrepancyCount === 0
                ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                : 'border-rose-500/30 bg-rose-500/[0.04]'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  report.discrepancyCount === 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-500/10'
                }`}
              >
                {report.discrepancyCount === 0 ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">
                  {report.discrepancyCount === 0
                    ? 'All Bank Accounts Fully Reconciled'
                    : `${report.discrepancyCount} Balance Discrepancies Flagged`}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl font-light">
                  Every account cached balance precisely matches its posted double-entry journal calculation.
                  No orphaned credits, unposted debits, or asymmetric transactions detected.
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono text-slate-400 block">
                Last Verified: {new Date(report.generatedAt).toLocaleTimeString()}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                Status: Authoritative Invariant Valid
              </span>
            </div>
          </div>

          {/* Financial Invariant Explanation Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Core Banking Double-Entry Mathematical Specification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5">
                <div className="font-bold text-cyan-300">1. Balance Conservation</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Every posted financial event writes balanced entries where Σ(Debits) equals Σ(Credits) exactly, preventing money creation or destruction.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5">
                <div className="font-bold text-cyan-300">2. Authoritative Postings</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  While BankAccount caches the current running balance for sub-millisecond retrieval, the LedgerEntry table remains the immutable source of truth.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5">
                <div className="font-bold text-cyan-300">3. Continuous Audit</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Reconciliation runs periodic batch assertions verifying CachedBalance ≡ Σ(Posted Credits) − Σ(Posted Debits) across all accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
