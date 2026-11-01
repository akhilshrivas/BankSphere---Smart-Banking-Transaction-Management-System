import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { FraudAlert } from '../../types';
import { ShieldAlert, CheckCircle2, AlertTriangle, Clock, Sparkles, Filter, Check, Eye } from 'lucide-react';

export const AdminFraudAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Cleared' | 'ConfirmedFraud' | 'UnderReview'>('Cleared');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'Critical' | 'High' | 'Medium'>('ALL');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getFraudAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    try {
      setSubmitting(true);
      await adminApi.reviewFraudAlert(selectedAlert.id, reviewStatus, resolutionNotes);
      setSelectedAlert(null);
      setResolutionNotes('');
      loadAlerts();
    } catch {
      alert('Failed to update alert.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const criticalCount = alerts.filter(a => a.severity === 'Critical').length;
  const pendingCount = alerts.filter(a => a.status === 'Pending' || a.status === 'UnderReview').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Real-time Risk Surveillance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Fraud Detection & AML</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Automated heuristic rule evaluation, velocity monitors, and human compliance resolution
          </p>
        </div>

        {/* Header Telemetry Pills */}
        <div className="flex items-center space-x-2">
          <div className="glass-panel px-3.5 py-2 rounded-2xl flex items-center space-x-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-400">Critical Alerts:</span>
            <span className="font-mono font-bold text-rose-400">{criticalCount}</span>
          </div>
          <div className="glass-panel px-3.5 py-2 rounded-2xl flex items-center space-x-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-400">Pending Review:</span>
            <span className="font-mono font-bold text-amber-400">{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {(['ALL', 'Critical', 'High', 'Medium'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterSeverity === sev
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            {sev === 'ALL' ? 'All Incidents' : `${sev} Severity`}
          </button>
        ))}
      </div>

      {/* Alert Feed Container */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-xl">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span>Scanning transaction surveillance queue...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="font-semibold text-white text-sm">No Active Risk Flags</p>
            <p className="text-slate-500 mt-1">All transaction velocities and amounts are within normal baselines.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredAlerts.map((a) => {
              const isCrit = a.severity === 'Critical';
              return (
                <div
                  key={a.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/[0.03] transition relative overflow-hidden group"
                >
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-1 ${
                      isCrit ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]' : 'bg-amber-400'
                    }`}
                  />

                  <div className="space-y-2 pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isCrit
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {a.severity}
                      </span>
                      <h3 className="font-bold text-white text-sm sm:text-base">{a.ruleName}</h3>
                      <span className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/20">
                        Ref: {a.referenceNumber}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed max-w-2xl">
                      {a.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500">Risk Score:</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                a.riskScore > 75 ? 'bg-rose-500' : 'bg-amber-400'
                              }`}
                              style={{ width: `${Math.min(a.riskScore, 100)}%` }}
                            />
                          </div>
                          <span className={`font-bold ${a.riskScore > 75 ? 'text-rose-400' : 'text-amber-400'}`}>
                            {a.riskScore}/100
                          </span>
                        </div>
                      </div>

                      <span>•</span>

                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">Status:</span>
                        <span className="text-amber-300 font-semibold">{a.status}</span>
                      </div>

                      <span>•</span>

                      <div className="flex items-center space-x-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(a.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2 pl-2 lg:pl-0">
                    <button
                      onClick={() => {
                        setSelectedAlert(a);
                        setReviewStatus('Cleared');
                        setResolutionNotes('Customer phone/device authorization verified. Activity determined legitimate.');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Review & Resolve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="glass-panel border border-white/20 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Compliance Finding Review</h2>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-white/5 text-xs font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Heuristic Rule:</span>
                <span className="text-white font-semibold">{selectedAlert.ruleName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Ref:</span>
                <span className="text-cyan-400">{selectedAlert.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Risk Assessment:</span>
                <span className="text-rose-400 font-bold">{selectedAlert.severity} ({selectedAlert.riskScore}/100)</span>
              </div>
            </div>

            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Determination Decision
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'Cleared', label: 'Cleared', desc: 'Legitimate activity' },
                    { id: 'UnderReview', label: 'Under Review', desc: 'Escalate to AML' },
                    { id: 'ConfirmedFraud', label: 'Fraud / SAR', desc: 'Block & report' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setReviewStatus(option.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        reviewStatus === option.id
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-sm'
                          : 'bg-slate-900/60 border-white/5 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{option.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Compliance Resolution Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record customer authorization method, rationale, or SAR compliance reference..."
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Committing...' : 'Record Finding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
