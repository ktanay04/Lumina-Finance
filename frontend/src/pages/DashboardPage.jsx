import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../services/api';
import { formatCurrency, formatCurrencyCompact } from '../utils/format';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CHART_COLORS = [
  '#7c3aed',
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#a855f7',
  '#ef4444',
];

function ExpensePieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div className="rounded-lg border border-white/25 bg-zinc-950 px-3 py-2.5 shadow-2xl ring-1 ring-black/50">
      <p className="text-sm font-semibold text-white">{row.name}</p>
      <p className="mt-0.5 text-sm tabular-nums text-zinc-200">{formatCurrency(row.value)}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { dataVersion } = useOutletContext();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    if (data?.monthOptions?.length) {
      setSelectedMonth(data.monthOptions[data.monthOptions.length - 1].key);
    }
  }, [data?.monthOptions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get('/api/dashboard');
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataVersion]);

  if (loading && !data) {
    return <p className="text-zinc-400">Loading your dashboard…</p>;
  }

  const selectedPieData = selectedMonth
    ? data?.pieChartDataByMonth?.[selectedMonth] ?? []
    : data?.pieChartData ?? [];
  const pieEmpty = !selectedPieData?.length;
  const lineEmpty = !data?.lineChartData?.some((x) => x.income > 0 || x.expense > 0);
  const pieSlices =
    selectedPieData?.map((item, i) => ({
      ...item,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    })) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">
        Welcome{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">Here is what&apos;s happening with your finances.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Balance"
          value={formatCurrency(data?.balance ?? 0)}
          icon={<Wallet className="h-5 w-5 text-violet-400" />}
          accent="border-violet-500/20"
        />
        <MetricCard
          title="Total Income"
          value={formatCurrency(data?.totalIncome ?? 0)}
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          accent="border-emerald-500/20"
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(data?.totalExpense ?? 0)}
          icon={<TrendingDown className="h-5 w-5 text-red-400" />}
          accent="border-red-500/20"
        />
      </div>

      {data?.insights && (
        <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-950/30 px-4 py-3 text-sm text-violet-100">
          {data.insights}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-surface-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">Cash Flow Trend</h2>
          <div className="mt-4 h-72">
            {lineEmpty ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 text-zinc-500">
                No timeline data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis
                    stroke="#71717a"
                    fontSize={12}
                    tickFormatter={(v) => formatCurrencyCompact(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fafafa',
                      border: '1px solid #d4d4d8',
                      borderRadius: '8px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
                    }}
                    labelStyle={{ color: '#18181b', fontWeight: 600 }}
                    itemStyle={{ color: '#3f3f46' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-surface-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-white">Expense Breakdown</h2>
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              >
                {data?.monthOptions?.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.month}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 h-72">
            {pieEmpty ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 text-center text-sm text-zinc-500">
                No category data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 4, bottom: 4 }}>
                  <Pie
                    data={pieSlices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="44%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    label={false}
                    stroke="#0a0a0a"
                    strokeWidth={1}
                  >
                    {pieSlices.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={ExpensePieTooltip} />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: 11,
                      lineHeight: '14px',
                      color: '#a1a1aa',
                      paddingTop: 4,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, accent }) {
  return (
    <div
      className={`rounded-2xl border bg-surface-raised/80 p-5 ${accent} border-white/5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-2">{icon}</div>
      </div>
    </div>
  );
}
