import { formatCurrency } from './format';

function thresholdKey(userId, month, category, level) {
  const safeCat = encodeURIComponent(category);
  return `lumina_budget_threshold_${userId}_${month}_${safeCat}_${level}`;
}

/**
 * Shows at most one toast / inbox row per budget row per session per threshold (50 / 90 / 100),
 * using sessionStorage so we do not spam on every navigation.
 */
export function notifyBudgetThresholds({ items, month, userId, showToast, addNotification }) {
  if (!userId || !items?.length) return;
  if (!showToast && !addNotification) return;

  let staggerMs = 0;
  const schedule = (fn) => {
    window.setTimeout(fn, staggerMs);
    staggerMs += 420;
  };

  const push = (key, payload) => {
    addNotification?.({ id: key, ...payload });
    if (showToast) {
      schedule(() => showToast(payload));
    }
  };

  for (const b of items) {
    const limit = Number(b.limit);
    const spent = Number(b.spent);
    if (!Number.isFinite(limit) || limit <= 0) continue;
    const pct = (spent / limit) * 100;

    if (pct >= 100) {
      const key = thresholdKey(userId, month, b.category, 100);
      if (sessionStorage.getItem(key)) continue;
      sessionStorage.setItem(key, '1');
      push(key, {
        variant: 'danger',
        title: 'Budget limit reached',
        message: `${b.category} has reached or passed 100% of your limit (${formatCurrency(
          spent,
        )} of ${formatCurrency(limit)}).`,
      });
      continue;
    }
    if (pct >= 90) {
      const key = thresholdKey(userId, month, b.category, 90);
      if (sessionStorage.getItem(key)) continue;
      sessionStorage.setItem(key, '1');
      push(key, {
        variant: 'warning',
        title: 'Budget at 90%',
        message: `${b.category} is at ${Math.round(pct)}% of your monthly limit (${formatCurrency(
          spent,
        )} of ${formatCurrency(limit)}).`,
      });
      continue;
    }
    if (pct >= 50) {
      const key = thresholdKey(userId, month, b.category, 50);
      if (sessionStorage.getItem(key)) continue;
      sessionStorage.setItem(key, '1');
      push(key, {
        variant: 'info',
        title: 'Budget halfway used',
        message: `${b.category} has reached ${Math.round(pct)}% of your limit (${formatCurrency(
          spent,
        )} of ${formatCurrency(limit)}).`,
      });
    }
  }
}
