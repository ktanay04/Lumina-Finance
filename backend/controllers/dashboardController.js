const Transaction = require('../models/Transaction');

const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getDashboardData = async (req, res) => {
  try {
    const userTx = await Transaction.find({ user: req.user._id }).lean();

    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of userTx) {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    }
    const balance = totalIncome - totalExpense;

    const expenseByCategory = {};
    for (const t of userTx) {
      if (t.type === 'expense') {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      }
    }
    const pieChartData = Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value,
    }));

    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthShort[d.getMonth()]} ${d.getFullYear()}`;
      buckets.push({ key, month: label, income: 0, expense: 0 });
    }
    const keyToBucket = Object.fromEntries(buckets.map((b) => [b.key, b]));

    for (const t of userTx) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const b = keyToBucket[key];
      if (b) b[t.type] += t.amount;
    }

    const lineChartData = buckets.map(({ month, income, expense }) => ({ month, income, expense }));

    let insights = 'Your spending is on track. Keep it up!';
    if (totalExpense > totalIncome && totalIncome > 0) {
      insights = 'Warning: You are spending more than you earn this period.';
    } else if (totalIncome === 0 && totalExpense > 0) {
      insights = 'Add income entries to see a fuller picture of your cash flow.';
    }

    res.json({
      balance,
      totalIncome,
      totalExpense,
      pieChartData,
      lineChartData,
      insights,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboardData };
