import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NewEntryModal from './NewEntryModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { formatYearMonth } from '../utils/month';
import { notifyBudgetThresholds } from '../utils/budgetNotifications';
import { notifyDashboardInsights } from '../utils/dashboardInsightNotifications';

export default function Layout() {
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAskAi = pathname === '/ask-ai';

  const bump = useCallback(() => setDataVersion((v) => v + 1), []);

  useEffect(() => {
    if (!user?._id) return undefined;
    let cancelled = false;
    (async () => {
      const ym = formatYearMonth();
      try {
        const { data } = await api.get(`/api/budgets?month=${ym}`);
        if (cancelled) return;
        notifyBudgetThresholds({
          items: data.items || [],
          month: ym,
          userId: user._id,
          showToast,
          addNotification,
        });
      } catch {
        /* ignore */
      }
      try {
        const { data: dash } = await api.get('/api/dashboard');
        if (cancelled) return;
        notifyDashboardInsights({
          insightKey: dash.insightKey,
          insights: dash.insights,
          userId: user._id,
          showToast,
          addNotification,
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataVersion, user?._id, showToast, addNotification]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        onNewEntry={() => setNewEntryOpen(true)}
        onSignOut={handleSignOut}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <TopBar />
        <main
          className={`flex-1 p-8 ${
            isAskAi
              ? 'flex min-h-0 flex-col overflow-hidden'
              : 'overflow-auto'
          }`}
        >
          <Outlet context={{ dataVersion, bump }} />
        </main>
      </div>
      <NewEntryModal
        open={newEntryOpen}
        onClose={() => setNewEntryOpen(false)}
        onSaved={bump}
      />
    </div>
  );
}
