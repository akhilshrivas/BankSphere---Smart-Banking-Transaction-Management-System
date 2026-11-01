import React, { useEffect, useState } from 'react';
import { transactionApi, accountApi } from '../services/api';
import { Transaction, Account } from '../types';
import {
  Search,
  Download,
  ArrowRightLeft,
  ArrowDownCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [selectedAccountId, typeFilter, startDate, endDate]);

  const loadAccounts = async () => {
    try {
      const res = await accountApi.getAccounts();
      setAccounts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedAccountId) params.accountId = selectedAccountId;
      if (typeFilter) params.type = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;

      const res = await transactionApi.getTransactions(params);
      setTransactions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!accounts.length) return;
    const targetAccId = selectedAccountId || accounts[0].id;
    try {
      const res = await transactionApi.downloadStatement(targetAccId, startDate || undefined, endDate || undefined);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BankSphere_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Could not generate CSV statement.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.referenceNumber.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Ledger Journal & Statements</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Authoritative, append-only financial journal with verifiable debit/credit balance proofs
          </p>
        </div>
        <button
          onClick={handleDownloadCsv}
          className="flex items-center space-x-2 px-5 py-3 glass-panel glass-panel-hover text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export CSV Statement</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shadow-lg">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search reference or memo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Account Filter */}
        <div>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountTypeName} ({a.accountNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="">All Operation Types</option>
            <option value="Deposit">Deposit (+)</option>
            <option value="Withdrawal">Withdrawal (-)</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* End Date */}
        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Querying posted ledger records...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">No transactions match your current search filters.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((t) => {
              const isExpanded = expandedId === t.id;
              const isDeposit = t.type === 'Deposit';
              const isFlagged = t.status === 'Flagged';

              return (
                <div key={t.id} className="transition hover:bg-white/[0.02]">
                  <div
                    onClick={() => toggleExpand(t.id)}
                    className="p-5 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <button className="text-slate-500 hover:text-slate-300 transition">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
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
                        <div className="text-sm font-bold text-white">
                          {t.description || t.type}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Ref: <span className="text-cyan-300">{t.referenceNumber}</span> • {new Date(t.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-base font-bold font-mono tracking-tight ${
                          isDeposit ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isDeposit ? '+' : '-'}${t.amount.toFixed(2)}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          t.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]'
                            : t.status === 'Flagged'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Double-Entry Inspector */}
                  {isExpanded && (
                    <div className="bg-slate-950/70 p-5 border-t border-white/5 space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Double-Entry Postings (Invariant Verified)</span>
                      </div>

                      {t.ledgerEntries && t.ledgerEntries.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {t.ledgerEntries.map((l) => (
                            <div
                              key={l.id}
                              className={`p-4 rounded-2xl border text-xs font-mono ${
                                l.entryType === 'Debit'
                                  ? 'bg-rose-950/20 border-rose-800/30 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                                  : 'bg-emerald-950/20 border-emerald-800/30 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.1)]'
                              }`}
                            >
                              <div className="flex justify-between font-bold text-sm">
                                <span>{l.entryType.toUpperCase()}</span>
                                <span>${l.amount.toFixed(2)}</span>
                              </div>
                              <div className="text-[11px] text-slate-300 mt-1">
                                Account: {l.accountNumber}
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                                Balance After: ${l.balanceAfter.toFixed(2)} • {l.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 font-mono">
                          Source Account: {t.sourceAccountNumber || 'N/A'} • Recipient Account: {t.destinationAccountNumber || 'N/A'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
