require('dotenv').config();
const path = require('path');

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'hsk_super_secret_jwt_key_2026_antigravity_platform',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: path.join(__dirname, '..', 'database', 'hsk_platform.sqlite'),
  UPLOAD_DIR: path.join(__dirname, '..', 'uploads'),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
};
