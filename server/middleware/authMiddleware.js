const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../database/db');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để truy cập hệ thống' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
    }

    // Check user status directly from Database to ensure instant lock/delete effect
    const user = db.prepare('SELECT id, username, full_name, email, role, status FROM users WHERE id = ?').get(userPayload.id);

    if (!user) {
      return res.status(403).json({ success: false, message: 'Tài khoản không tồn tại trên hệ thống' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ success: false, message: 'Tài khoản này đã bị khóa bởi Quản trị viên' });
    }

    if (user.status === 'deleted') {
      return res.status(403).json({ success: false, message: 'Tài khoản này đã bị xóa' });
    }

    req.user = user;
    next();
  });
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
