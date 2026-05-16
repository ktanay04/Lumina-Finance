import { useState } from 'react';
import { X, Camera, Mic, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import api from '../services/api';
import { categoriesForType } from '../constants/categories';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { formatCurrency } from '../utils/format';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function NewEntryModal({ open, onClose, onSaved }) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Housing');
  const [date, setDate] = useState(todayInputValue());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cats = categoriesForType(type);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num < 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/transactions', {
        type,
        amount: num,
        category,
        date: new Date(date).toISOString(),
        notes,
      });
      const id = data?._id ? `lumina_tx_saved_${data._id}` : `lumina_tx_saved_${Date.now()}`;
      const kind = type === 'income' ? 'Income' : 'Expense';
      const detail = `${formatCurrency(data?.amount ?? num)} · ${category} (${kind})`;
      const message = `${detail}. This entry has been added to your transactions history.`;
      addNotification({
        id,
        variant: 'info',
        title: 'Transaction saved',
        message,
      });
      showToast({
        variant: 'info',
        title: 'Transaction saved',
        message: 'This entry has been added to your transactions history.',
      });
      onSaved?.();
      onClose();
      setAmount('');
      setNotes('');
      setType('expense');
      setCategory('Housing');
      setDate(todayInputValue());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-surface-card p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">New Entry</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 py-3 text-sm font-medium text-violet-300 opacity-60"
          >
            <Camera className="h-4 w-4" />
            Scan Receipt
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 py-3 text-sm font-medium text-emerald-300 opacity-60"
          >
            <Mic className="h-4 w-4" />
            Voice Input
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-raised p-1">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Housing');
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition ${
                type === 'expense'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ArrowDownCircle
                className={`h-5 w-5 ${type === 'expense' ? 'text-red-400' : ''}`}
              />
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Salary');
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition ${
                type === 'income'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ArrowUpCircle
                className={`h-5 w-5 ${type === 'income' ? 'text-emerald-400' : ''}`}
              />
              Income
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-zinc-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border-2 border-violet-500/50 bg-surface-raised py-4 pl-9 pr-4 text-2xl font-bold text-white outline-none focus:border-violet-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-raised px-3 py-3 text-sm text-white outline-none ring-violet-500/30 focus:border-violet-500/50 focus:ring-2"
              >
                {cats.map((c) => (
                  <option key={c} value={c} className="bg-zinc-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-raised px-3 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What was this for?"
              className="w-full resize-none rounded-xl border border-white/10 bg-surface-raised px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/50 focus:ring-2"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
