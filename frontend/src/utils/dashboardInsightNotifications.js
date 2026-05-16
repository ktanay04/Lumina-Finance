const INSIGHT_KEYS = new Set(['on_track', 'overspending', 'no_income']);

const INSIGHT_UI = {
  overspending: {
    variant: 'danger',
    title: 'Spending vs income',
  },
  no_income: {
    variant: 'warning',
    title: 'Cash flow snapshot',
  },
  on_track: {
    variant: 'info',
    title: "You're on track",
  },
};

function storageKey(userId, insightKey) {
  return `lumina_dashboard_insight_${userId}_${insightKey}`;
}

/**
 * One toast + inbox row per dashboard insight type per browser session (sessionStorage),
 * aligned with how budget threshold alerts work.
 */
export function notifyDashboardInsights({ insightKey, insights, userId, showToast, addNotification }) {
  if (!userId || !insightKey || !INSIGHT_KEYS.has(insightKey)) return;
  if (!showToast && !addNotification) return;

  const key = storageKey(userId, insightKey);
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');

  const body =
    typeof insights === 'string' && insights.trim() ? insights.trim() : 'Open your dashboard for details.';
  const ui = INSIGHT_UI[insightKey] || INSIGHT_UI.on_track;
  const payload = { variant: ui.variant, title: ui.title, message: body };

  addNotification?.({ id: key, ...payload });
  if (showToast) {
    globalThis.setTimeout(() => showToast(payload), 350);
  }
}
