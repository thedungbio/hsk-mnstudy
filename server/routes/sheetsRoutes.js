const express = require('express');
const router = express.Router();
const sheetsController = require('../controllers/sheetsSyncController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Chỉ Admin mới được thực hiện và xem đồng bộ Google Sheets
router.post('/sync', authenticateToken, requireRole(['admin']), sheetsController.syncSheets);
router.post('/direct-sync', authenticateToken, requireRole(['admin']), sheetsController.directSyncData);
router.get('/logs', authenticateToken, requireRole(['admin']), sheetsController.getSyncLogs);

module.exports = router;
