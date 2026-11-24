const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, requireRole(['admin', 'teacher']), userController.getUsers);
router.post('/', authenticateToken, requireRole(['admin']), userController.createUser);
router.put('/profile', authenticateToken, requireRole(['admin']), authController.updateAdminProfile);
router.patch('/profile', authenticateToken, requireRole(['admin']), authController.updateAdminProfile);
router.put('/admin/profile', authenticateToken, requireRole(['admin']), authController.updateAdminProfile);
router.patch('/admin/profile', authenticateToken, requireRole(['admin']), authController.updateAdminProfile);
router.get('/audit-logs', authenticateToken, requireRole(['admin']), userController.getAuditLogs);
router.patch('/:id/status', authenticateToken, requireRole(['admin']), userController.updateUserStatus);
router.put('/:id', authenticateToken, requireRole(['admin']), userController.updateUser);
router.delete('/:id', authenticateToken, requireRole(['admin']), userController.deleteUser);
router.get('/dashboard-stats', authenticateToken, requireRole(['admin', 'teacher']), userController.getDashboardStats);

module.exports = router;
