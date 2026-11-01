import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { TrendingUp, ArrowDownCircle, ArrowUpCircle, Sparkles, PieChart as PieIcon } from 'lucide-react';

export const Analytics: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [spending, setSpending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7'];

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [overRes, monthRes, spendRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getMonthly(),
        analyticsApi.getSpending(),
      ]);
      setOverview(overRes.data);
      setMonthly(monthRes.data || []);
      setSpending(spendRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-sm">Crunching analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Capital Velocity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Spending & Financial Insights</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Holistic breakdown of capital velocity, inflows, and expense classifications
        </p>
      </div>

      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 shadow-xl space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Deposits</span>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              ${overview.totalDeposits.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-1.5 pt-1">
              <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Capital Inflows</span>
            </div>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 shadow-xl space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Withdrawals</span>
            <div className="text-3xl font-extrabold text-rose-400 font-mono">
              ${overview.totalWithdrawals.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-1.5 pt-1">
              <ArrowUpCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Cash Outflows</span>
            </div>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 shadow-xl space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Transfers</span>
            <div className="text-3xl font-extrabold text-cyan-400 font-mono">
              ${overview.totalTransfers.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-1.5 pt-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Counterparty Settlements</span>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Inflows vs Outflows Bar Chart */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white">Monthly Liquidity Flow</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(16px)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '1rem',
                  boxShadow: '0 20px 30px rgba(0,0,0,0.5)',
                }}
              />
              <Legend />
              <Bar dataKey="inflow" name="Inflows" fill="#34d399" radius={[6, 6, 0, 0]} />
              <Bar dataKey="outflow" name="Outflows" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Table & Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white">Expense Distribution</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spending}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {spending.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(16px)',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '0.75rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white">Category Spend Breakdown</h2>
          <div className="divide-y divide-white/5">
            {spending.map((item, idx) => (
              <div key={item.category} className="py-3.5 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-200 font-medium">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white font-mono">${item.amount.toFixed(2)}</div>
                  <div className="text-xs text-slate-400">{item.percentage}% of disbursements</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
