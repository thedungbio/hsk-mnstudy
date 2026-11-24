const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Tất cả học sinh, giáo viên, admin đã đăng nhập đều có thể học
router.get('/vocabulary', authenticateToken, studyController.getVocabulary);
router.post('/vocabulary/star', authenticateToken, studyController.toggleStarVocabulary);
router.get('/vocabulary/starred', authenticateToken, studyController.getStarredVocabulary);

router.get('/grammar', authenticateToken, studyController.getGrammar);

router.get('/listening', authenticateToken, studyController.getListeningList);
router.get('/listening/:id', authenticateToken, studyController.getListeningDetail);

router.get('/speaking', authenticateToken, studyController.getSpeakingList);

router.get('/reading', authenticateToken, studyController.getReadingList);
router.get('/reading/:id', authenticateToken, studyController.getReadingDetail);

router.get('/writing', authenticateToken, studyController.getWritingList);

router.post('/progress', authenticateToken, studyController.recordProgress);

module.exports = router;
