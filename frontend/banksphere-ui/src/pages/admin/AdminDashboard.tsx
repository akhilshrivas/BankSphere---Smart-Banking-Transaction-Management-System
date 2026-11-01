import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { AdminDashboard as IAdminDashboard } from '../../types';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Wallet,
  Users,
  Scale,
  Activity,
  ArrowRight,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<IAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-sm">Querying admin telemetry...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-slate-500 glass-panel rounded-2xl">Failed to load admin telemetry.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Admin Glass Header with Mirror Finish */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mirror-water relative overflow-hidden shadow-2xl">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Central Governance & Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Institutional Telemetry</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Live systemic liquidity, AML risk alerts, and double-entry ledger invariant verification
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/fraud-alerts"
              className="flex items-center space-x-2 px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs uppercase tracking-wider rounded-2xl border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)] transition"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Fraud Queue ({data.pendingFraudAlerts})</span>
            </Link>
            <Link
              to="/admin/reconciliation"
              className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition"
            >
              <Scale className="w-4 h-4" />
              <span>Reconcile Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel glass-panel-hover rounded-3xl p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total System Reserves</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
            ${data.totalSystemReserves.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Liquid Vault Custody</span>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-3xl p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Customer Base</span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">{data.totalCustomers}</div>
          <div className="text-xs text-slate-400">{data.totalAccounts} accounts active</div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-3xl p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">24h Settlement Volume</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
            ${data.volumeToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400">{data.totalTransactionsToday} settlements today</div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-3xl p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Pending AML Alerts</span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400 tracking-tight">{data.pendingFraudAlerts}</div>
          <div className="text-xs text-slate-400">Awaiting officer determination</div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Alerts */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Pending Fraud Detections</span>
            </h2>
            <Link
              to="/admin/fraud-alerts"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
            >
              <span>Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {data.recentAlerts.length > 0 ? (
              data.recentAlerts.map((alert) => (
                <div key={alert.id} className="py-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-200">{alert.ruleName}</div>
                    <div className="text-xs text-slate-400">{alert.description}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Tx: {alert.referenceNumber} • Risk: {alert.riskScore}/100
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      alert.severity === 'Critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-500 text-sm">
                No active fraud alerts. System rules within normal variance.
              </div>
            )}
          </div>
        </div>

        {/* Administrative Audit Log */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Compliance Audit Journal</span>
            </h2>
          </div>

          <div className="divide-y divide-white/5 text-xs font-mono">
            {data.recentAudits.length > 0 ? (
              data.recentAudits.slice(0, 7).map((audit) => (
                <div key={audit.id} className="py-3 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-200 font-sans">
                      {audit.action} on {audit.entityName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">{audit.details}</div>
                    <div className="text-[10px] text-slate-500">By: {audit.userEmail}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(audit.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-500 text-sm">No recent audit events.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
