/** Expense dropdown (matches UI). */
const EXPENSE_CATEGORIES = [
  'Housing',
  'Transportation',
  'Food',
  'Utilities',
  'Insurance',
  'Medical',
  'Saving & Investing',
  'Personal Spending',
  'Entertainment',
  'Miscellaneous',
];

/** Income includes Salary (screenshots) plus expense labels for flexibility. */
const INCOME_CATEGORIES = ['Salary', ...EXPENSE_CATEGORIES];

function isAllowedCategory(type, category) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.includes(category);
}

module.exports = { EXPENSE_CATEGORIES, INCOME_CATEGORIES, isAllowedCategory };
