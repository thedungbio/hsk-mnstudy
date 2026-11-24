const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const config = require('../config/config');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu' });
    }

    let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

    // Nếu chưa thấy trong DB, tự động đồng bộ ngay lập tức từ Google Sheet
    if (!user) {
      try {
        const sheetsService = require('../services/googleSheetsService');
        await sheetsService.syncFromGoogleSheets({ sheetId: '1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4' });
        user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
      } catch (err) {}
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.' });
    }

    if (user.status === 'deleted') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị xóa khỏi hệ thống.' });
    }

    let isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      // Thử đồng bộ lại nếu mật khẩu mới vừa được chỉnh sửa trên Google Sheets
      try {
        const sheetsService = require('../services/googleSheetsService');
        await sheetsService.syncFromGoogleSheets({ sheetId: '1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4' });
        const refreshedUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
        if (refreshedUser) {
          isMatch = bcrypt.compareSync(password, refreshedUser.password_hash);
          if (isMatch) user = refreshedUser;
        }
      } catch (err) {}
    }

    if (!isMatch) {
      if (user.role === 'admin') {
        console.warn(`[SECURITY ALERT] Đăng nhập thất bại vào tài khoản admin '${user.username}' từ IP: ${req.ip || 'local'}`);
        db.prepare(`
          INSERT INTO audit_logs (user_id, action, target, details, ip_address)
          VALUES (?, ?, ?, ?, ?)
        `).run(user.id, 'SECURITY_ALERT_FAILED_LOGIN', 'auth', JSON.stringify({ username: user.username, reason: 'Mật khẩu không chính xác' }), req.ip || '');
      }
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    // Generate JWT Token
    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      email: user.email
    };

    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

    // Record audit log
    const auditAction = user.role === 'admin' ? 'ADMIN_LOGIN' : 'LOGIN';
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, auditAction, 'auth', JSON.stringify({ role: user.role, username: user.username }), req.ip || '');

    console.log(`[AUTH] Người dùng '${user.username}' (vai trò: ${user.role}) đăng nhập thành công từ IP: ${req.ip || 'local'}`);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ trong quá trình xác thực', error: error.message });
  }
};

// Lấy danh sách tài khoản công khai hiển thị trên trang Đăng nhập
exports.getPublicAccounts = (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, full_name, role, status
      FROM users
      WHERE status = 'active'
      ORDER BY id DESC
      LIMIT 12
    `).all();

    res.json({ success: true, accounts: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đồng bộ công khai từ Google Sheets (để có thể bấm đồng bộ ngay từ trang đăng nhập)
exports.publicSyncSheets = async (req, res) => {
  try {
    const sheetsService = require('../services/googleSheetsService');
    const result = await sheetsService.syncFromGoogleSheets({
      sheetId: req.body.sheetId || '1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4'
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, full_name, email, role, status, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản' });
    }

    // Lấy tiến độ học tập nếu là học sinh
    let progress = [];
    let starredCount = 0;
    if (user.role === 'student') {
      progress = db.prepare('SELECT skill, completed_items_count, streak_days, last_studied_at FROM learning_progress WHERE user_id = ?').all(user.id);
      const starred = db.prepare('SELECT count(*) as count FROM user_starred_vocabulary WHERE user_id = ?').get(user.id);
      starredCount = starred.count;
    }

    res.json({
      success: true,
      user: {
        ...user,
        progress,
        starred_count: starredCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi truy xuất thông tin', error: error.message });
  }
};

exports.changePassword = (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu cũ và mới' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
    }

    const user = db.prepare('SELECT password_hash, username, role FROM users WHERE id = ?').get(req.user.id);
    const isMatch = bcrypt.compareSync(old_password, user.password_hash);
    if (!isMatch) {
      if (user && user.role === 'admin') {
        console.warn(`[SECURITY ALERT] Đổi mật khẩu thất bại cho admin '${user.username}': Mật khẩu hiện tại sai.`);
      }
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(new_password, salt);

    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user.id);

    const action = user && user.role === 'admin' ? 'ADMIN_PASSWORD_CHANGE' : 'USER_PASSWORD_CHANGE';
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      action,
      'users',
      JSON.stringify({ username: user.username, role: user.role }),
      req.ip || ''
    );

    console.log(`[AUTH] '${user.username}' (${user.role}) đã đổi mật khẩu thành công.`);

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật mật khẩu', error: error.message });
  }
};

/**
 * Dedicated endpoint for Admin to update own profile (full_name, email, password)
 * with robust validation, security checks, and audit logging.
 */
exports.updateAdminProfile = (req, res) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }

    // Role check: Only admin or primary admin can use this endpoint
    if (adminUser.role !== 'admin' && adminUser.id !== 1 && adminUser.username !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Quản trị viên mới có quyền cập nhật thông tin tại khu vực này'
      });
    }

    const { full_name, email, password, new_password, current_password, old_password } = req.body;

    const targetPass = new_password || password;
    const suppliedCurrentPass = current_password || old_password;

    // Check if at least one field is provided
    if (!full_name && !email && !targetPass) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ít nhất một thông tin cần cập nhật (họ tên, email hoặc mật khẩu mới)'
      });
    }

    const updatedFields = [];
    let cleanFullName = adminUser.full_name;
    let cleanEmail = adminUser.email;

    // 1. Validate full_name
    if (full_name !== undefined) {
      if (typeof full_name !== 'string' || full_name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Họ và tên phải có tối thiểu 2 ký tự'
        });
      }
      if (full_name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Họ và tên không được vượt quá 100 ký tự'
        });
      }
      cleanFullName = full_name.trim();
      updatedFields.push('full_name');
    }

    // 2. Validate email
    if (email !== undefined) {
      if (typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Email phải là chuỗi hợp lệ'
        });
      }
      const trimmedEmail = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Định dạng email không hợp lệ (Ví dụ: admin@hskmaster.edu.vn)'
        });
      }
      if (trimmedEmail.length > 150) {
        return res.status(400).json({
          success: false,
          message: 'Email không được vượt quá 150 ký tự'
        });
      }

      // Check email collision with other users
      const existingEmailUser = db.prepare('SELECT id, username FROM users WHERE email = ?').get(trimmedEmail);
      if (existingEmailUser && existingEmailUser.id !== adminUser.id) {
        return res.status(400).json({
          success: false,
          message: `Email '${trimmedEmail}' đã được sử dụng bởi tài khoản khác (${existingEmailUser.username})`
        });
      }
      cleanEmail = trimmedEmail;
      updatedFields.push('email');
    }

    // 3. Validate password
    let newPasswordHash = null;
    if (targetPass !== undefined) {
      if (typeof targetPass !== 'string' || targetPass.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có tối thiểu 6 ký tự'
        });
      }
      if (targetPass.length > 128) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu không được dài quá 128 ký tự'
        });
      }

      // If current password provided, verify it
      if (suppliedCurrentPass) {
        const currentDbUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(adminUser.id);
        if (!currentDbUser || !bcrypt.compareSync(suppliedCurrentPass, currentDbUser.password_hash)) {
          return res.status(400).json({
            success: false,
            message: 'Mật khẩu hiện tại không chính xác'
          });
        }
      }

      const salt = bcrypt.genSaltSync(10);
      newPasswordHash = bcrypt.hashSync(targetPass, salt);
      updatedFields.push('password');
    }

    // Perform database update
    if (newPasswordHash) {
      db.prepare('UPDATE users SET full_name = ?, email = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(cleanFullName, cleanEmail, newPasswordHash, adminUser.id);
    } else {
      db.prepare('UPDATE users SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(cleanFullName, cleanEmail, adminUser.id);
    }

    // Ensure admin role & active status remain intact
    const refreshedAdmin = db.prepare('SELECT id, username, full_name, email, role, status, updated_at FROM users WHERE id = ?').get(adminUser.id);

    // Audit logging
    const logDetails = {
      admin_id: adminUser.id,
      username: adminUser.username,
      updated_fields: updatedFields,
      timestamp: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      adminUser.id,
      'ADMIN_PROFILE_UPDATE',
      'users',
      JSON.stringify(logDetails),
      req.ip || ''
    );

    console.log(`[ADMIN AUDIT] Quản trị viên '${adminUser.username}' (id: ${adminUser.id}) đã cập nhật thông tin: [${updatedFields.join(', ')}] từ IP ${req.ip || 'local'}`);

    res.json({
      success: true,
      message: `Cập nhật thông tin Quản trị viên thành công (${updatedFields.join(', ')})`,
      user: refreshedAdmin
    });
  } catch (error) {
    console.error('Lỗi updateAdminProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông tin Quản trị viên',
      error: error.message
    });
  }
};
