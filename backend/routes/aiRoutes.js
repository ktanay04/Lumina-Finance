const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { chatWithSarvam, getLatestConversation } = require('../controllers/aiChatController');

const router = express.Router();

router.use(authMiddleware);
router.get('/conversation/latest', getLatestConversation);
router.post('/chat', chatWithSarvam);

module.exports = router;
