const bcrypt = require('bcryptjs');
const db = require('../database/db');

// Lấy danh sách tài khoản cho Admin / Giáo viên
exports.getUsers = (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 50 } = req.query;

    let query = 'SELECT id, username, full_name, email, role, status, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (username LIKE ? OR full_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), (parseInt(page, 10) - 1) * parseInt(limit, 10));

    const users = db.prepare(query).all(...params);

    const totalCountStmt = db.prepare('SELECT count(*) as count FROM users');
    const total = totalCountStmt.get().count;

    res.json({
      success: true,
      users,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin tạo tài khoản mới
exports.createUser = (req, res) => {
  try {
    const { username, password, full_name, email, role = 'student', status = 'active' } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên đăng nhập, mật khẩu và họ tên' });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername === 'admin') {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập "admin" được dành riêng cho Quản trị viên chính' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại trong hệ thống' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const info = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, email, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(cleanUsername, password_hash, full_name.trim(), email ? email.trim() : '', role, status);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user ? req.user.id : null,
      'USER_CREATE',
      'users',
      JSON.stringify({
        new_user_id: info.lastInsertRowid,
        username: cleanUsername,
        role,
        status,
        created_by: req.user ? req.user.username : 'admin'
      }),
      req.ip || ''
    );

    console.log(`[USER MANAGEMENT] Admin '${req.user ? req.user.username : 'system'}' đã tạo tài khoản '${cleanUsername}' (vai trò: ${role}).`);

    res.json({
      success: true,
      message: 'Tạo tài khoản thành công',
      user_id: info.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật trạng thái tài khoản (Khóa / Mở khóa)
exports.updateUserStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'locked', 'deleted'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const target = db.prepare('SELECT id, username, role, status FROM users WHERE id = ?').get(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
    }

    // Protection rule for primary admin (id: 1 or username: 'admin')
    if (target.id === 1 || target.username === 'admin') {
      if (status === 'locked' || status === 'deleted') {
        const actorName = req.user ? req.user.username : 'Unknown';
        console.warn(`[SECURITY VIOLATION] Thao tác thay đổi trạng thái admin thành '${status}' bởi '${actorName}' đã bị chặn!`);

        db.prepare(`
          INSERT INTO audit_logs (user_id, action, target, details, ip_address)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          req.user ? req.user.id : null,
          'SECURITY_ALERT_ADMIN_PROTECTED',
          'users',
          JSON.stringify({
            attempted_action: `set_status_${status}`,
            target_id: target.id,
            target_username: target.username,
            blocked: true,
            reason: 'Tài khoản Quản trị viên chính (admin) được bảo vệ vĩnh viễn, không thể khóa hoặc xóa.'
          }),
          req.ip || ''
        );

        return res.status(403).json({
          success: false,
          message: 'Tài khoản Quản trị viên chính (admin) được bảo vệ vĩnh viễn, không thể khóa hoặc xóa.'
        });
      }
    }

    const oldStatus = target.status;
    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user ? req.user.id : null,
      'USER_STATUS_CHANGE',
      'users',
      JSON.stringify({
        target_id: target.id,
        target_username: target.username,
        old_status: oldStatus,
        new_status: status,
        performed_by: req.user ? req.user.username : 'system'
      }),
      req.ip || ''
    );

    console.log(`[USER MANAGEMENT] Admin '${req.user ? req.user.username : 'system'}' cập nhật trạng thái '${target.username}' từ '${oldStatus}' sang '${status}'.`);

    res.json({
      success: true,
      message: `Cập nhật trạng thái người dùng thành: ${status}`,
      user: {
        id: target.id,
        username: target.username,
        status: status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa tài khoản người dùng với cơ chế bảo vệ admin vĩnh viễn
exports.deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    const target = db.prepare('SELECT id, username, role, status FROM users WHERE id = ?').get(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
    }

    if (target.id === 1 || target.username === 'admin') {
      const actorName = req.user ? req.user.username : 'Unknown';
      console.warn(`[SECURITY VIOLATION] Thao tác xóa tài khoản Quản trị viên chính bởi '${actorName}' bị chặn vĩnh viễn!`);

      db.prepare(`
        INSERT INTO audit_logs (user_id, action, target, details, ip_address)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        req.user ? req.user.id : null,
        'SECURITY_ALERT_ADMIN_PROTECTED',
        'users',
        JSON.stringify({
          attempted_action: 'delete_admin',
          target_id: target.id,
          target_username: target.username,
          blocked: true,
          reason: 'Tài khoản Quản trị viên chính (admin) được bảo vệ vĩnh viễn, không thể xóa.'
        }),
        req.ip || ''
      );

      return res.status(403).json({
        success: false,
        message: 'Tài khoản Quản trị viên chính (admin) được bảo vệ vĩnh viễn, không thể xóa.'
      });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user ? req.user.id : null,
      'USER_DELETE',
      'users',
      JSON.stringify({
        target_id: target.id,
        target_username: target.username,
        deleted_by: req.user ? req.user.username : 'system'
      }),
      req.ip || ''
    );

    console.log(`[USER MANAGEMENT] Admin '${req.user ? req.user.username : 'system'}' đã xóa tài khoản '${target.username}' (id: ${target.id}).`);

    res.json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin chi tiết người dùng
exports.updateUser = (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, status, password } = req.body;

    const target = db.prepare('SELECT id, username, role, status, full_name, email FROM users WHERE id = ?').get(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
    }

    const isPrimaryAdmin = (target.id === 1 || target.username === 'admin');

    let cleanRole = role || target.role;
    let cleanStatus = status || target.status;

    if (isPrimaryAdmin) {
      if (role && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không thể giáng cấp tài khoản Quản trị viên chính.'
        });
      }
      if (status && status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản Quản trị viên chính luôn luôn ở trạng thái hoạt động (active).'
        });
      }
      cleanRole = 'admin';
      cleanStatus = 'active';
    }

    const cleanFullName = full_name ? full_name.trim() : target.full_name;
    const cleanEmail = email ? email.trim() : target.email;

    if (cleanEmail) {
      const existingEmail = db.prepare('SELECT id, username FROM users WHERE email = ?').get(cleanEmail);
      if (existingEmail && existingEmail.id !== target.id) {
        return res.status(400).json({
          success: false,
          message: `Email '${cleanEmail}' đã được sử dụng bởi tài khoản khác (${existingEmail.username})`
        });
      }
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có tối thiểu 6 ký tự' });
      }
      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(password, salt);
      db.prepare('UPDATE users SET full_name = ?, email = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(cleanFullName, cleanEmail, password_hash, target.id);
    } else {
      db.prepare('UPDATE users SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(cleanFullName, cleanEmail, target.id);
    }

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user ? req.user.id : null,
      isPrimaryAdmin ? 'ADMIN_PROFILE_UPDATE' : 'USER_UPDATE',
      'users',
      JSON.stringify({
        target_id: target.id,
        target_username: target.username,
        updated_by: req.user ? req.user.username : 'system'
      }),
      req.ip || ''
    );

    res.json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      user: {
        id: target.id,
        username: target.username,
        full_name: cleanFullName,
        email: cleanEmail,
        role: cleanRole,
        status: cleanStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách audit logs
exports.getAuditLogs = (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs').all();
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thống kê tổng quan cho Dashboard Admin & Teacher
exports.getDashboardStats = (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT count(*) as count FROM users WHERE status != "deleted"').get().count;
    const totalStudents = db.prepare('SELECT count(*) as count FROM users WHERE role = "student" AND status = "active"').get().count;
    const totalTeachers = db.prepare('SELECT count(*) as count FROM users WHERE role = "teacher" AND status = "active"').get().count;
    const totalVocab = db.prepare('SELECT count(*) as count FROM vocabulary').get().count;
    const totalGrammar = db.prepare('SELECT count(*) as count FROM grammar').get().count;
    const totalListening = db.prepare('SELECT count(*) as count FROM listening_materials').get().count;
    const totalReading = db.prepare('SELECT count(*) as count FROM reading_materials').get().count;
    const totalExams = db.prepare('SELECT count(*) as count FROM hsk_exams').get().count;
    const totalExamAttempts = db.prepare('SELECT count(*) as count FROM exam_results').get().count;
    const totalDocuments = db.prepare('SELECT count(*) as count FROM uploaded_documents').get().count;

    // Phân bố từ vựng theo cấp độ HSK
    const vocabByHsk = db.prepare(`
      SELECT hsk_level, count(*) as count
      FROM vocabulary
      GROUP BY hsk_level
      ORDER BY hsk_level ASC
    `).all();

    // Kết quả thi gần nhất
    const recentExamResults = db.prepare(`
      SELECT r.id, r.total_score, r.is_passed, r.created_at, u.full_name as student_name, e.title as exam_title, e.hsk_level
      FROM exam_results r
      JOIN users u ON r.user_id = u.id
      JOIN hsk_exams e ON r.exam_id = e.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalVocab,
        totalGrammar,
        totalListening,
        totalReading,
        totalExams,
        totalExamAttempts,
        totalDocuments,
        vocabByHsk,
        recentExamResults
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
