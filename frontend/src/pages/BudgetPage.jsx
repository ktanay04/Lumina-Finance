import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import { formatCurrency } from '../utils/format';
import { formatYearMonth } from '../utils/month';
import { notifyBudgetThresholds } from '../utils/budgetNotifications';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';

function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function barColor(pct) {
  if (pct >= 100) return 'bg-rose-500';
  if (pct >= 75) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function textColor(pct) {
  if (pct >= 100) return 'text-rose-400';
  if (pct >= 75) return 'text-amber-400';
  return 'text-emerald-400';
}

export default function BudgetPage() {
  const { dataVersion, bump } = useOutletContext();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [month, setMonth] = useState(formatYearMonth);
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('Utilities');
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/budgets?month=${month}`);
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month, dataVersion]);

  useEffect(() => {
    if (loading || !user?._id || !items.length) return;
    notifyBudgetThresholds({
      items,
      month,
      userId: user._id,
      showToast,
      addNotification,
    });
  }, [loading, items, month, user?._id, showToast, addNotification]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    const num = parseFloat(limit);
    if (Number.isNaN(num) || num < 0) {
      setError('Enter a valid limit');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/budgets', { category, limit: num, month });
      setLimit('');
      bump();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Budget Planner</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Set limits and monitor your spending for {monthLabel(month)}.
      </p>

      <div className="mt-4">
        <label className="sr-only" htmlFor="budget-month">
          Month
        </label>
        <input
          id="budget-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border border-white/10 bg-surface-raised px-4 py-2 text-sm text-white outline-none focus:border-violet-500/50"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-white/5 bg-surface-card p-6">
        <h2 className="text-sm font-semibold text-white">Create new rule</h2>
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-raised px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-zinc-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Monthly limit
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-surface-raised py-3 pl-8 pr-4 text-sm text-white outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Save
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Active budgets</h2>
        {loading ? (
          <p className="mt-4 text-zinc-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center text-zinc-500">
            No budgets for this month. Add a rule above.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {items.map((b) => {
              const displayPct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
              const barWidth = Math.min(100, displayPct);
              return (
                <li
                  key={b._id}
                  className="rounded-2xl border border-white/5 bg-surface-card p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{b.category}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {formatCurrency(b.spent)} spent out of {formatCurrency(b.limit)}.
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${textColor(displayPct)}`}>
                      {displayPct}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all ${barColor(displayPct)}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
