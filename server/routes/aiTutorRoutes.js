const express = require('express');
const router = express.Router();
const aiTutorController = require('../controllers/aiTutorController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/ask', authenticateToken, aiTutorController.askTutor);

module.exports = router;
