/** YYYY-MM for a date (defaults to today, local calendar). */
export function formatYearMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
