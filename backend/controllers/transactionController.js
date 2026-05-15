const Transaction = require('../models/Transaction');
const { isAllowedCategory } = require('../constants/categories');

const getTransactions = async (req, res) => {
  try {
    const { search, type } = req.query;
    const filter = { user: req.user._id };
    if (type === 'income' || type === 'expense') {
      filter.type = type;
    }
    let q = Transaction.find(filter).sort({ date: -1 });
    const list = await q.exec();
    if (search && String(search).trim()) {
      const s = String(search).trim().toLowerCase();
      const filtered = list.filter(
        (t) =>
          t.category.toLowerCase().includes(s) ||
          (t.notes && t.notes.toLowerCase().includes(s))
      );
      return res.json(filtered);
    }
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const addTransaction = async (req, res) => {
  try {
    const { type, amount, category, date, notes } = req.body;
    if (!type || amount == null || !category) {
      return res.status(400).json({ message: 'type, amount, and category are required' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }
    if (!isAllowedCategory(type, category)) {
      return res.status(400).json({ message: 'Invalid category for this transaction type' });
    }
    const num = Number(amount);
    if (Number.isNaN(num) || num < 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount: num,
      category,
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
    });
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const t = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!t) return res.status(404).json({ message: 'Not found' });
    const { type, amount, category, date, notes } = req.body;
    const newType = type || t.type;
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }
    const newCategory = category != null ? category : t.category;
    if (!isAllowedCategory(newType, newCategory)) {
      return res.status(400).json({ message: 'Invalid category for this transaction type' });
    }
    if (amount != null) {
      const num = Number(amount);
      if (Number.isNaN(num) || num < 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      t.amount = num;
    }
    if (type) t.type = type;
    if (category != null) t.category = category;
    if (date != null) t.date = new Date(date);
    if (notes != null) t.notes = notes;
    await t.save();
    res.json(t);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const t = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!t) return res.status(404).json({ message: 'Not found' });
    res.json({ id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTransactions, addTransaction, updateTransaction, deleteTransaction };
