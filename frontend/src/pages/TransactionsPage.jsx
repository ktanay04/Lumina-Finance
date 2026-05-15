import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Filter, Trash2 } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/format';

function formatDisplayDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function TransactionsPage() {
  const { dataVersion, bump } = useOutletContext();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (typeFilter === 'income' || typeFilter === 'expense') params.set('type', typeFilter);
        if (search.trim()) params.set('search', search.trim());
        const { data } = await api.get(`/api/transactions?${params.toString()}`);
        if (!cancelled) setList(data);
      } catch {
        if (!cancelled) setList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataVersion, typeFilter, search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/api/transactions/${id}`);
      bump();
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Transactions</h1>
      <p className="mt-1 text-sm text-zinc-400">Manage and view your financial history.</p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search by category or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-xl border border-white/10 bg-surface-raised px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 sm:flex-1"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-surface-raised px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/5 bg-surface-card">
        {loading ? (
          <p className="p-8 text-zinc-400">Loading…</p>
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {list.map((t) => (
                  <tr key={t._id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-zinc-300">{formatDisplayDate(t.date)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200">
                        {t.category}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-zinc-400">
                      {t.notes?.trim() ? t.notes : 'No notes'}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-semibold ${
                        t.type === 'income' ? 'text-emerald-400' : 'text-zinc-200'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(t._id)}
                        className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
