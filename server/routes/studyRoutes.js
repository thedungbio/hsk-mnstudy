const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Tất cả học sinh, giáo viên, admin đã đăng nhập đều có thể học
router.get('/vocabulary', authenticateToken, studyController.getVocabulary);
router.post('/vocabulary/star', authenticateToken, studyController.toggleStarVocabulary);
router.get('/vocabulary/starred', authenticateToken, studyController.getStarredVocabulary);

// Quản lý Từ vựng (Thêm, Sửa nhanh, Xóa)
router.post('/vocabulary', authenticateToken, requireRole(['admin', 'teacher']), studyController.createVocabulary);
router.put('/vocabulary/:id', authenticateToken, requireRole(['admin', 'teacher']), studyController.updateVocabulary);
router.delete('/vocabulary/:id', authenticateToken, requireRole(['admin', 'teacher']), studyController.deleteVocabulary);

router.get('/grammar', authenticateToken, studyController.getGrammar);
// Quản lý Ngữ pháp (Thêm, Sửa nhanh, Xóa)
router.post('/grammar', authenticateToken, requireRole(['admin', 'teacher']), studyController.createGrammar);
router.put('/grammar/:id', authenticateToken, requireRole(['admin', 'teacher']), studyController.updateGrammar);
router.delete('/grammar/:id', authenticateToken, requireRole(['admin', 'teacher']), studyController.deleteGrammar);

router.get('/listening', authenticateToken, studyController.getListeningList);
router.get('/listening/:id', authenticateToken, studyController.getListeningDetail);

router.get('/speaking', authenticateToken, studyController.getSpeakingList);
// Quản lý Luyện nói (Thêm, Sửa nhanh, Xóa)
router.post('/speaking', authenticateToken, requireRole(['admin', 'teacher']), studyController.createSpeaking);
router.put('/speaking/:id', authenticateToken, requireRole(['admin', 'teacher']), studyController.updateSpeaking);
router.delete('/speaking/:id', authenticateToken, requireRole(['admin', 'teacher']), studyController.deleteSpeaking);

router.get('/reading', authenticateToken, studyController.getReadingList);
router.get('/reading/:id', authenticateToken, studyController.getReadingDetail);

router.get('/writing', authenticateToken, studyController.getWritingList);

router.post('/progress', authenticateToken, studyController.recordProgress);

module.exports = router;
