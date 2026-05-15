const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { EXPENSE_CATEGORIES } = require('../constants/categories');

const getBudgets = async (req, res) => {
  try {
    const month = req.query.month || defaultMonth();
    const budgets = await Budget.find({ user: req.user._id, month }).lean();

    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const expenses = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      date: { $gte: start, $lt: end },
    }).lean();

    const spentByCategory = {};
    for (const e of expenses) {
      spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
    }

    const items = budgets.map((b) => ({
      ...b,
      spent: spentByCategory[b.category] || 0,
    }));

    res.json({ month, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

function defaultMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

const upsertBudget = async (req, res) => {
  try {
    const { category, limit, month } = req.body;
    const m = month || defaultMonth();
    if (!category || limit == null) {
      return res.status(400).json({ message: 'category and limit are required' });
    }
    if (!EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid expense category' });
    }
    const num = Number(limit);
    if (Number.isNaN(num) || num < 0) {
      return res.status(400).json({ message: 'Invalid limit' });
    }
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month: m },
      { limit: num },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(budget);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Budget already exists for this category/month' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const b = await Budget.findOneAndDelete({ _id: id, user: req.user._id });
    if (!b) return res.status(404).json({ message: 'Not found' });
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getBudgets, upsertBudget, deleteBudget };
