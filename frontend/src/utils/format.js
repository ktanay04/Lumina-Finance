/** Indian Rupees — used across the app for Indian users. */
export function formatCurrency(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Shorter INR labels for chart axes (e.g. ₹12K). */
export function formatCurrencyCompact(value) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return formatCurrency(n);
  }
}
