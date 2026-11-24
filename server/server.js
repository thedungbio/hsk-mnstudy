const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config/config');

// Require DB to initialize schema if not done
require('./database/db');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure uploads directory exists
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

// Static uploads directory
app.use('/uploads', express.static(config.UPLOAD_DIR));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sheets', require('./routes/sheetsRoutes'));
app.use('/api/ai-import', require('./routes/aiImportRoutes'));
app.use('/api/study', require('./routes/studyRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/ai-tutor', require('./routes/aiTutorRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    platform: 'HSKMaster AI EdTech Platform',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Serve frontend dist in production if available
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống nội bộ máy chủ'
  });
});

// Start Server
app.listen(config.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 HSKMaster AI Platform đang chạy tại: http://localhost:${config.PORT}`);
  console.log(`📚 Database: SQLite WAL mode ready`);
  console.log(`📥 Uploads folder: ${config.UPLOAD_DIR}`);
  console.log(`💻 Frontend SPA: ${fs.existsSync(clientDist) ? 'Đã tích hợp sẵn' : 'Chạy riêng qua Vite'}`);
  console.log(`====================================================`);

  // Tự động đồng bộ từ Google Sheets khi khởi động và định kỳ mỗi 30 giây
  const defaultSheetId = '1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4';
  const sheetsService = require('./services/googleSheetsService');

  setTimeout(async () => {
    try {
      const res = await sheetsService.syncFromGoogleSheets({ sheetId: defaultSheetId });
      console.log(`[AUTO-SYNC GOOGLE SHEETS] Đồng bộ khởi động thành công:`, res.message);
    } catch (e) {
      console.log(`[AUTO-SYNC GOOGLE SHEETS] Lưu ý khởi động:`, e.message);
    }
  }, 1000);

  setInterval(async () => {
    try {
      await sheetsService.syncFromGoogleSheets({ sheetId: defaultSheetId });
    } catch (e) {}
  }, 30000);
});
