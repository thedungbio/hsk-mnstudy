const express = require('express');
const router = express.Router();
const hskExamController = require('../controllers/hskExamController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/list', authenticateToken, hskExamController.getExamList);
router.get('/detail/:id', authenticateToken, hskExamController.getExamDetail);
router.post('/submit/:id', authenticateToken, hskExamController.submitExam);
router.get('/history', authenticateToken, hskExamController.getUserExamHistory);

module.exports = router;
