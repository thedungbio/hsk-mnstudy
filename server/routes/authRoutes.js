const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/public-accounts', authController.getPublicAccounts);
router.post('/public-sync', authController.publicSyncSheets);
router.get('/me', authenticateToken, authController.getMe);
router.post('/change-password', authenticateToken, authController.changePassword);
router.put('/profile', authenticateToken, authController.updateAdminProfile);
router.patch('/profile', authenticateToken, authController.updateAdminProfile);
router.put('/admin/profile', authenticateToken, authController.updateAdminProfile);
router.patch('/admin/profile', authenticateToken, authController.updateAdminProfile);

module.exports = router;
