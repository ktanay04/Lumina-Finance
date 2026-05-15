const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { registerUser, loginUser, changePassword } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
