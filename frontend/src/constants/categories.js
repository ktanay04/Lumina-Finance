export const EXPENSE_CATEGORIES = [
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

export const INCOME_CATEGORIES = ['Salary', ...EXPENSE_CATEGORIES];

export function categoriesForType(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}
