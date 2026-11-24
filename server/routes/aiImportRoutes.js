const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const aiImportController = require('../controllers/aiImportController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Cấu hình lưu file với kiểm tra định dạng
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs', '.ps1', '.dll'];

  if (dangerousExts.includes(ext)) {
    return cb(new Error('Từ chối: File thực thi không được phép tải lên!'), false);
  }

  const allowedExts = ['.docx', '.doc', '.xlsx', '.xls', '.pdf', '.txt', '.csv'];
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ file Word (.docx), Excel (.xlsx), PDF, TXT hoặc CSV!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Quyền nhập dữ liệu: Admin và Giáo viên được ủy quyền
router.post('/upload', authenticateToken, requireRole(['admin', 'teacher']), upload.single('file'), aiImportController.uploadAndAnalyze);
router.get('/preview/:documentId', authenticateToken, requireRole(['admin', 'teacher']), aiImportController.getPreviewData);
router.put('/preview/:documentId', authenticateToken, requireRole(['admin', 'teacher']), aiImportController.updatePreviewData);
router.post('/confirm/:documentId', authenticateToken, requireRole(['admin', 'teacher']), aiImportController.confirmImport);
router.get('/history', authenticateToken, requireRole(['admin', 'teacher']), aiImportController.getImportHistory);

module.exports = router;
