const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { chatWithSarvam, getLatestConversation, scanReceipt } = require('../controllers/aiChatController');

const router = express.Router();

router.use(authMiddleware);
router.get('/conversation/latest', getLatestConversation);
router.post('/chat', chatWithSarvam);
router.post('/scan-receipt', scanReceipt);

module.exports = router;
