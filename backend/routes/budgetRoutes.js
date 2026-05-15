const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getBudgets, upsertBudget, deleteBudget } = require('../controllers/budgetController');

const router = express.Router();

router.use(authMiddleware);
router.get('/', getBudgets);
router.post('/', upsertBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
