import React, { useEffect, useState } from 'react';
import { customerApi, analyticsApi } from '../services/api';
import { CustomerDashboard } from '../types';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowRightLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Send,
  Sparkles,
  Wifi,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<CustomerDashboard | null>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [spending, setSpending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  const COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7'];

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, monthlyRes, spendRes] = await Promise.all([
        customerApi.getMe(),
        analyticsApi.getMonthly(),
        analyticsApi.getSpending(),
      ]);
      setData(dashRes.data);
      setMonthly(monthlyRes.data || []);
      setSpending(spendRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  // Human Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: '☀️' };
    if (hour < 18) return { text: 'Good afternoon', icon: '🌤️' };
    return { text: 'Good evening', icon: '🌙' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center space-y-4 shadow-2xl">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-xs font-semibold text-slate-300 tracking-wide">
            Syncing double-entry ledger...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400 glass-panel rounded-2xl">
        Could not connect to BankSphere node. Please refresh.
      </div>
    );
  }

  const greeting = getGreeting();
  const primaryAccount = data.accounts[0];

  return (
    <div className="space-y-8">
      {/* Humanized Top Greeting Banner with Glass Mirror Finish */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-6 sm:p-8 mirror-water">
        {/* Caustic water shimmer overlay */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs text-cyan-300 font-medium shadow-sm">
              <span>{greeting.icon}</span>
              <span>{greeting.text}, {data.customerName.split(' ')[0]}</span>
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              <span className="text-[10px] text-slate-300 font-mono">ID: {data.customerNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Financial Overview & Liquidity
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              All balances are backed 1:1 by liquid central reserve assets and continuously reconciled.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/transfer"
              className="group relative px-5 py-3 rounded-2xl overflow-hidden font-bold text-xs tracking-wider uppercase text-white shadow-[0_4px_25px_rgba(14,165,233,0.35)] transition-all hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 group-hover:opacity-90 transition" />
              <span className="relative z-10 flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4" />
                <span>Send Money</span>
              </span>
            </Link>

            <Link
              to="/deposit"
              className="px-5 py-3 rounded-2xl glass-panel glass-panel-hover text-slate-200 hover:text-white font-bold text-xs tracking-wider uppercase flex items-center space-x-2 transition"
            >
              <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
              <span>Deposit</span>
            </Link>

            <Link
              to="/withdraw"
              className="px-5 py-3 rounded-2xl glass-panel glass-panel-hover text-slate-200 hover:text-white font-bold text-xs tracking-wider uppercase flex items-center space-x-2 transition"
            >
              <ArrowUpCircle className="w-4 h-4 text-rose-400" />
              <span>Withdraw</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section: Virtual Liquid Obsidian Card + KPI Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Virtual Metallic Liquid Obsidian Card */}
        <div className="lg:col-span-5 flex flex-col justify-between metal-obsidian-card water-shimmer rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden group">
          {/* Subtle water mirror line across the card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition duration-700" />

          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-300/90">
                BankSphere Obsidian Mirror
              </span>
              <div className="text-sm font-semibold text-white/90">
                {primaryAccount ? primaryAccount.accountTypeName : 'Primary Checking'}
              </div>
            </div>
            <div className="flex items-center space-x-3 text-white/80">
              <Wifi className="w-5 h-5 rotate-90" />
              <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
                PREMIUM
              </span>
            </div>
          </div>

          {/* Chip & Balance */}
          <div className="relative z-10 my-6 space-y-4">
            <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-200 via-amber-400 to-yellow-500 shadow-md border border-amber-300/50 flex items-center justify-center">
              <div className="w-9 h-6 border border-amber-600/40 rounded-sm grid grid-cols-2 gap-1 p-0.5 opacity-70" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
                  Authoritative Net Balance
                </span>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-400 hover:text-white transition"
                  title="Toggle Balance Visibility"
                >
                  {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                {showBalance
                  ? `$${data.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '••••••••••'}
              </div>
            </div>
          </div>

          {/* Footer Details */}
          <div className="relative z-10 flex justify-between items-end text-xs font-mono pt-3 border-t border-white/10 text-slate-300">
            <div>
              <span className="text-[9px] uppercase tracking-wider block text-slate-400">Cardholder</span>
              <span className="font-semibold text-white tracking-wide">{data.customerName.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider block text-slate-400">Account No</span>
              <span className="font-semibold text-cyan-300">
                {primaryAccount ? primaryAccount.accountNumber : '•••• •••• 5821'}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider block text-slate-400">Status</span>
              <span className="text-emerald-400 font-sans font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ACTIVE</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Frosted Liquid Glass KPI Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Reserves</span>
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
                ${data.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-emerald-400 flex items-center space-x-1 mt-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Zero financial variance</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-white/5">
              Available instantly for outbound wire & peer transfers
            </div>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Bank Accounts</span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {data.accounts.length}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Checking & High-Yield Savings
              </div>
            </div>
            <Link
              to="/accounts"
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 pt-2 border-t border-white/5"
            >
              <span>Open additional account</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Payees / Beneficiaries</span>
              <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-inner">
                <Send className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {data.beneficiaries.length}
              </div>
              <div className="text-xs text-slate-300 mt-1">Pre-cleared counterparties</div>
            </div>
            <Link
              to="/beneficiaries"
              className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1 pt-2 border-t border-white/5"
            >
              <span>Manage address book</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Transactions</span>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {data.recentTransactions.length}
              </div>
              <div className="text-xs text-slate-300 mt-1">Posted journal entries</div>
            </div>
            <Link
              to="/transactions"
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 pt-2 border-t border-white/5"
            >
              <span>Download CSV statement</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Send Humanized Avatars Carousel */}
      {data.beneficiaries.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Instant Send to Contacts</span>
              </h2>
              <p className="text-xs text-slate-400">Tap counterparty to initiate zero-fee instant transfer</p>
            </div>
            <Link to="/beneficiaries" className="text-xs text-cyan-400 hover:underline font-semibold">
              View All ({data.beneficiaries.length})
            </Link>
          </div>

          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            {data.beneficiaries.map((b, idx) => (
              <Link
                key={b.id}
                to={`/transfer?dest=${b.accountNumber}`}
                className="group flex flex-col items-center space-y-2 p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition shrink-0"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-base text-white shadow-lg transition-transform group-hover:scale-105 border border-white/20"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS[idx % COLORS.length]}, #1e1b4b)`,
                  }}
                >
                  {b.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition">
                    {b.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ••••{b.accountNumber.slice(-4)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Visual Analytics: Fluid Cash Flow & Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Cash Flow Area Chart */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Monthly Liquidity Flow</h2>
              <p className="text-xs text-slate-400">Deposits (Inflows) vs Outbound Wire / Transfers (Outflows)</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>Inflows</span>
              </span>
              <span className="flex items-center space-x-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                <span>Outflows</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="inflowWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="outflowWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="inflow" name="Inflow ($)" stroke="#34d399" fillOpacity={1} fill="url(#inflowWater)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="outflow" name="Outflow ($)" stroke="#38bdf8" fillOpacity={1} fill="url(#outflowWater)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Breakdown Donut */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Disbursements</h2>
            <p className="text-xs text-slate-400">Category allocation</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {spending.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spending}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
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
            ) : (
              <div className="text-xs text-slate-500">No outgoing activity recorded yet</div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            {spending.slice(0, 3).map((item, idx) => (
              <div key={item.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-300 font-medium">{item.category}</span>
                </div>
                <span className="font-mono text-slate-200 font-semibold">${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Cards & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Cards */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Your Bank Accounts</h2>
            <Link to="/accounts" className="text-xs text-cyan-400 hover:underline font-semibold">
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {data.accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/30 transition-all space-y-2 group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200 group-hover:text-cyan-300 transition">
                    {acc.accountTypeName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      acc.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">
                  ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>No: {acc.accountNumber}</span>
                  <span className="text-slate-300">{acc.currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions List with Double-Entry Verification Badges */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Recent Transactions</h2>
              <p className="text-xs text-slate-400">Atomic posted journal entries with balanced ledger proof</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
            >
              <span>Audit Journal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((tx) => {
                const isDeposit = tx.type === 'Deposit';
                const isFlagged = tx.status === 'Flagged';

                return (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between group hover:bg-white/[0.02] px-2 rounded-xl transition">
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isFlagged
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                            : isDeposit
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        }`}
                      >
                        {isFlagged ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : isDeposit ? (
                          <ArrowDownCircle className="w-5 h-5" />
                        ) : (
                          <ArrowRightLeft className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-100 group-hover:text-white transition">
                          {tx.description || tx.type}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          Ref: <span className="text-cyan-400/90">{tx.referenceNumber}</span> • {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-base font-bold font-mono tracking-tight ${
                          isDeposit ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isDeposit ? '+' : '-'}${tx.amount.toFixed(2)}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          tx.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : tx.status === 'Flagged'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-slate-500 text-sm">
                No posted transactions yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
