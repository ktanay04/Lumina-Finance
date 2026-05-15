const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getDashboardData } = require('../controllers/dashboardController');

const router = express.Router();

router.use(authMiddleware);
router.get('/', getDashboardData);

module.exports = router;
