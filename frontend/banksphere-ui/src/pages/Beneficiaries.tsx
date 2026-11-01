import React, { useEffect, useState } from 'react';
import { beneficiaryApi } from '../services/api';
import { Beneficiary } from '../types';
import { Users, Plus, Trash2, ArrowRightLeft, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Beneficiaries: React.FC = () => {
  const [list, setList] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('BankSphere');
  const [routingNumber, setRoutingNumber] = useState('021000021');
  const [nickname, setNickname] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const AVATAR_COLORS = [
    'from-blue-600 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-purple-600 to-indigo-600',
    'from-amber-500 to-rose-500',
    'from-pink-600 to-rose-600',
  ];

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const loadBeneficiaries = async () => {
    try {
      setLoading(true);
      const res = await beneficiaryApi.getBeneficiaries();
      setList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await beneficiaryApi.addBeneficiary({
        name,
        accountNumber,
        bankName,
        routingNumber,
        nickname,
      });
      setList([res.data, ...list]);
      setModalOpen(false);
      setName('');
      setAccountNumber('');
      setNickname('');
      setFeedback('Beneficiary authorized successfully!');
    } catch {
      alert('Failed to register beneficiary.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this payee?')) return;
    try {
      await beneficiaryApi.deleteBeneficiary(id);
      setList(list.filter((b) => b.id !== id));
    } catch {
      alert('Could not remove beneficiary.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Counterparty Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Verified Beneficiaries</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Pre-authorized counterparties for zero-friction instant capital settlement
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-[0_4px_25px_rgba(14,165,233,0.35)] transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Payee</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-2 shadow-lg">
          <Check className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Querying verified counterparties...</div>
      ) : list.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <Users className="w-12 h-12 mx-auto text-slate-500 opacity-60" />
          <p>No beneficiaries registered yet. Add counterparties for swift transfers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((b, idx) => (
            <div
              key={b.id}
              className="glass-panel glass-panel-hover rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${
                        AVATAR_COLORS[idx % AVATAR_COLORS.length]
                      } flex items-center justify-center text-white font-extrabold text-sm shadow-md border border-white/20`}
                    >
                      {b.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{b.name}</h3>
                      <span className="text-xs text-cyan-300 font-medium">
                        {b.nickname || b.bankName}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition"
                    title="Remove Payee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Account:</span>
                    <span className="text-white font-bold">{b.accountNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Institution:</span>
                    <span className="text-slate-200">{b.bankName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Routing:</span>
                    <span className="text-slate-200">{b.routingNumber}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={`/transfer?dest=${b.accountNumber}`}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-cyan-500/20 shadow-sm transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Send Funds</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Payee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass-panel border-white/20 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl mirror-water">
            <h2 className="text-xl font-bold text-white">Add Beneficiary Payee</h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Recipient Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Smith / Apex Inc"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1020495830"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Bank / Financial Institution
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Nickname (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Landlord / Jane Checking"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition"
                >
                  Authorize Payee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
