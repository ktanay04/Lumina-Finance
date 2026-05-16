import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  LogOut,
  Plus,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({ onNewEntry, onSignOut }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-violet-600/20 text-white border-l-2 border-violet-500 -ml-px pl-[11px]'
        : 'text-zinc-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <aside className="flex w-64 flex-col border-r border-white/5 bg-surface-card/80 px-4 py-6">
      <div className="mb-8 flex items-center gap-2 px-2">
        <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-lg" />
        <span className="text-lg font-semibold tracking-tight text-white">Lumina Finance</span>
      </div>

      <button
        type="button"
        onClick={onNewEntry}
        className="mb-8 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500"
      >
        <Plus className="h-4 w-4" />
        New Entry
      </button>

      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Main menu
      </p>
      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/" end className={linkClass}>
          <LayoutDashboard className="h-5 w-5 shrink-0 opacity-80" />
          Dashboard
        </NavLink>
        <NavLink to="/transactions" className={linkClass}>
          <Receipt className="h-5 w-5 shrink-0 opacity-80" />
          Transactions
        </NavLink>
        <NavLink to="/budget" className={linkClass}>
          <PieChart className="h-5 w-5 shrink-0 opacity-80" />
          Budget
        </NavLink>
        <NavLink to="/ask-ai" className={linkClass}>
          <Sparkles className="h-5 w-5 shrink-0 opacity-80" />
          Ask AI
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </button>
    </aside>
  );
}
