const https = require('https');
const http = require('http');
const bcrypt = require('bcryptjs');
const db = require('../database/db');

/**
 * Extract Google Sheet ID from any format:
 * - Raw ID: e.g. "1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4"
 * - Full URL: https://docs.google.com/spreadsheets/d/1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4/edit?usp=sharing
 * - URL with gid: https://docs.google.com/spreadsheets/d/1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4/edit#gid=0
 * - URL export/pub: https://docs.google.com/spreadsheets/d/1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4/export?format=csv
 * - Published /e/ URL: https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml
 * - Auto-trims whitespace, quotes, and trailing slashes
 */
function extractSheetId(input) {
  if (!input || typeof input !== 'string') return '';
  let str = input.trim().replace(/^["']|["']$/g, '').trim();

  // 1. Standard /spreadsheets/d/<sheetId> format
  const dMatch = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]{15,})/i);
  if (dMatch && dMatch[1]) {
    return dMatch[1].trim();
  }

  // 2. Published web format /spreadsheets/d/e/<sheetId>
  const eMatch = str.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]{15,})/i);
  if (eMatch && eMatch[1]) {
    return eMatch[1].trim();
  }

  // 3. Query parameter key=<sheetId> or id=<sheetId>
  const paramMatch = str.match(/[?&](?:id|key)=([a-zA-Z0-9-_]{15,})/i);
  if (paramMatch && paramMatch[1]) {
    return paramMatch[1].trim();
  }

  // 4. URL path segment
  if (str.includes('/')) {
    const cleanUrl = str.split('?')[0].split('#')[0];
    const parts = cleanUrl.split('/').filter(p => p.length >= 15 && !p.includes('.') && !p.includes(':'));
    if (parts.length > 0) {
      return parts[parts.length - 1].trim();
    }
  }

  // 5. Clean up any accidental leading/trailing non-alphanumeric chars
  const rawClean = str.replace(/^[^\w-]+|[^\w-]+$/g, '').trim();
  return rawClean;
}

/**
 * Fetch text from a URL (e.g. Google Sheets CSV export link)
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      // Follow redirects if any (301, 302, 307)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Tải dữ liệu từ Google Sheets thất bại với mã lỗi HTTP: ${res.statusCode}`));
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

/**
 * Clean & normalize column header names:
 * - Converts Vietnamese 'đ' / 'Đ' to 'd' before NFD
 * - Strips diacritics
 * - Converts spaces, special chars, punctuation to '_'
 * - Trims leading & trailing '_'
 */
function normalizeKey(str) {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')           // Xử lý đ/Đ tiếng Việt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu thanh tiếng Việt
    .replace(/[^a-z0-9]/g, '_')      // Thay ký tự đặc biệt bằng _
    .replace(/_+/g, '_')             // Gộp nhiều dấu gạch dưới liên tiếp
    .replace(/^_+|_+$/g, '');        // Trim _ ở đầu và cuối
}

/**
 * Parse a standard CSV/TSV string into array of objects based on header row
 * Supports comma, tab, semicolon delimiters, quoted values, and trims whitespace
 */
function parseCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  // Strip BOM if present
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length < 2) return [];

  // Auto-detect delimiter: tab, semicolon or comma
  let delimiter = ',';
  const firstLine = lines[0];
  if (firstLine.includes('\t') && !firstLine.includes(',')) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  }

  // Helper to split row respecting double quotes
  const parseRow = (text, delim) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const rawHeaders = parseRow(lines[0], delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());
  const normalizedHeaders = rawHeaders.map(h => normalizeKey(h));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i], delimiter).map(v => v.replace(/^["']|["']$/g, '').trim());
    if (values.some(v => v !== '')) {
      const obj = {};
      normalizedHeaders.forEach((header, idx) => {
        if (header) {
          obj[header] = values[idx] !== undefined ? values[idx].trim() : '';
        }
      });
      rows.push(obj);
    }
  }

  return rows;
}

/**
 * Extract field values supporting both English and Vietnamese headers seamlessly
 */
function extractUserFields(rawRecord, defaultRole = 'student') {
  if (!rawRecord || typeof rawRecord !== 'object') {
    return {
      username: '',
      rawPassword: 'student123',
      fullName: '',
      email: '',
      role: defaultRole || 'student',
      status: 'active'
    };
  }

  // Normalize all keys of record for foolproof matching with both raw and normalized Vietnamese/English headers
  const record = {};
  for (const k of Object.keys(rawRecord)) {
    record[k] = rawRecord[k];
    const nk = normalizeKey(k);
    if (nk && record[nk] === undefined) {
      record[nk] = rawRecord[k];
    }
  }

  // 1. Username (Tên đăng nhập / Tài khoản)
  const username = (
    record.username ||
    record.user_name ||
    record.user ||
    record.ten_dang_nhap ||
    record.dang_nhap ||
    record.tai_khoan ||
    record.ten_tai_khoan ||
    record.tk ||
    record.ten_tk ||
    record.account ||
    record.account_name ||
    record.login ||
    record.ma_nguoi_dung ||
    record.ma_so ||
    record.ma_hoc_sinh ||
    record.ma_sinh_vien ||
    record.ma_gv ||
    record.ma_nv ||
    record.id_nguoi_dung ||
    ''
  ).toString().trim();

  // 2. Password (Mật khẩu)
  const rawPassword = (
    record.password ||
    record.pass ||
    record.mat_khau ||
    record.matkhau ||
    record.mk ||
    record.password_hash ||
    record.pwd ||
    record.pass_word ||
    (record.role === 'admin' ? 'admin123' : (record.role === 'teacher' ? 'teacher123' : 'student123'))
  ).toString().trim();

  // 3. Full Name (Họ và tên)
  const fullName = (
    record.full_name ||
    record.fullname ||
    record.name ||
    record.ho_va_ten ||
    record.ho_ten ||
    record.hoten ||
    record.ten ||
    record.display_name ||
    record.ten_nguoi_dung ||
    record.ho_ten_hoc_sinh ||
    record.ho_ten_giao_vien ||
    username
  ).toString().trim();

  // 4. Email (Hòm thư điện tử)
  const email = (
    record.email ||
    record.e_mail ||
    record.mail ||
    record.email_address ||
    record.thu_dien_tu ||
    record.dia_chi_email ||
    record.hop_thu ||
    record.hom_thu ||
    ''
  ).toString().trim();

  // 5. Role (Vai trò / Phân quyền)
  const rawRole = (
    record.role ||
    record.vai_tro ||
    record.chuc_vu ||
    record.quyen ||
    record.quyen_han ||
    record.loai_tai_khoan ||
    record.phan_quyen ||
    record.account_type ||
    record.type ||
    defaultRole ||
    'student'
  ).toString().toLowerCase().trim();

  const normRole = normalizeKey(rawRole);

  let role = 'student';
  if (
    normRole.includes('admin') ||
    normRole.includes('quan_tri') ||
    normRole.includes('quantri') ||
    normRole.includes('quan_ly') ||
    normRole.includes('root') ||
    normRole.includes('superadmin') ||
    normRole.includes('manager')
  ) {
    role = 'admin';
  } else if (
    normRole.includes('teach') ||
    normRole.includes('giao_vien') ||
    normRole.includes('giaovien') ||
    normRole.includes('gv') ||
    normRole.includes('giang_vien') ||
    normRole.includes('tro_giang') ||
    normRole.includes('tutor')
  ) {
    role = 'teacher';
  } else {
    role = 'student';
  }

  // 6. Status (Trạng thái tài khoản)
  const rawStatus = (
    record.status ||
    record.trang_thai ||
    record.tinh_trang ||
    record.trang_thai_tai_khoan ||
    record.kich_hoat ||
    'active'
  ).toString().toLowerCase().trim();

  const normStatus = normalizeKey(rawStatus);

  let status = 'active';
  if (
    normStatus.includes('khoa') ||
    normStatus.includes('lock') ||
    normStatus.includes('block') ||
    normStatus.includes('suspend') ||
    normStatus.includes('disable') ||
    normStatus.includes('inactive') ||
    normStatus === '0' ||
    normStatus === 'false' ||
    normStatus === 'no' ||
    normStatus.includes('ngung') ||
    normStatus.includes('dung')
  ) {
    status = 'locked';
  } else if (
    normStatus.includes('xoa') ||
    normStatus.includes('delet')
  ) {
    status = 'deleted';
  } else {
    status = 'active';
  }

  return { username, rawPassword, fullName, email, role, status };
}

/**
 * Sync accounts from a list of user records into the Database.
 * CRITICAL SECURITY RULE: The root 'admin' account (id: 1 or username: 'admin')
 * is permanently protected:
 * - NEVER locked or deleted by external sheet data (status is strictly forced to 'active').
 * - NEVER demoted to student or teacher (role is strictly kept as 'admin').
 * - Password cannot be overwritten by external sheet data.
 */
function syncAccountRecords(records, defaultRole = null) {
  let createdCount = 0;
  let updatedCount = 0;
  let lockedCount = 0;
  let adminProtectedCount = 0;
  const adminNotes = [];
  const errors = [];

  const checkUserStmt = db.prepare('SELECT id, password_hash, status, role FROM users WHERE username = ?');
  const insertUserStmt = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, email, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const updateUserStmt = db.prepare(`
    UPDATE users
    SET full_name = ?, email = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE username = ?
  `);
  const updatePasswordStmt = db.prepare(`
    UPDATE users SET password_hash = ? WHERE username = ?
  `);

  const runSync = db.transaction((userList) => {
    for (const record of userList) {
      try {
        const { username, rawPassword, fullName, email, role, status } = extractUserFields(record, defaultRole);
        if (!username) continue;

        const isRootAdmin = (username.toLowerCase() === 'admin');
        const existing = checkUserStmt.get(username);

        // Security rule: root admin check also covers user ID 1
        const isProtectedAdmin = isRootAdmin || (existing && existing.id === 1);

        // Final role and status enforcement
        let finalRole = role;
        let finalStatus = status;

        if (isProtectedAdmin) {
          finalRole = 'admin';   // Never demote root admin
          finalStatus = 'active'; // Never lock or delete root admin
          adminProtectedCount++;
          adminNotes.push(
            `Tài khoản quản trị gốc "${username}" (ID: ${existing ? existing.id : 1}) được bảo vệ an toàn: Giữ quyền quản trị tối cao, trạng thái hoạt động và bảo toàn mật khẩu.`
          );
        }

        if (finalStatus === 'locked') {
          lockedCount++;
        }

        // Hash password if not already bcrypt
        let passwordHash = rawPassword;
        if (!rawPassword.startsWith('$2a$') && !rawPassword.startsWith('$2b$')) {
          const salt = bcrypt.genSaltSync(10);
          passwordHash = bcrypt.hashSync(rawPassword, salt);
        }

        if (existing) {
          // Update user details with protected role & status
          updateUserStmt.run(fullName || existing.full_name || username, email || existing.email || '', finalRole, finalStatus, username);

          // DO NOT overwrite password for root admin from external sheets
          if (!isProtectedAdmin && (record.password || record.mat_khau || record.mk || record.pass)) {
            updatePasswordStmt.run(passwordHash, username);
          }
          updatedCount++;
        } else {
          // Inserting new user
          insertUserStmt.run(username, passwordHash, fullName || username, email, finalRole, finalStatus);
          createdCount++;
        }
      } catch (rowErr) {
        errors.push(`Lỗi xử lý tài khoản ${record.username || record.ten_dang_nhap || 'không tên'}: ${rowErr.message}`);
      }
    }
  });

  runSync(records);

  return {
    totalProcessed: records.length,
    createdCount,
    updatedCount,
    lockedCount,
    adminProtectedCount,
    adminNotes,
    errors
  };
}

/**
 * Main Google Sheets Synchronization Function
 */
async function syncFromGoogleSheets({ sheetId, customUrl, adminId }) {
  // Extract and clean sheetId if passed as URL or raw ID
  let cleanSheetId = extractSheetId(sheetId || '');
  let cleanCustomUrl = customUrl ? customUrl.trim() : null;

  // If customUrl is a Google Sheets URL, extract sheetId from it too
  if (!cleanSheetId && cleanCustomUrl && cleanCustomUrl.includes('google.com/spreadsheets')) {
    cleanSheetId = extractSheetId(cleanCustomUrl);
  }

  try {
    let allRecords = [];
    let sourceInfo = '';

    if (cleanSheetId) {
      sourceInfo = `Google Sheet ID: ${cleanSheetId}`;

      // 1. Fetch default primary sheet (gid=0 / gviz default)
      let primaryCsv = '';
      try {
        const defaultUrl = `https://docs.google.com/spreadsheets/d/${cleanSheetId}/gviz/tq?tqx=out:csv`;
        primaryCsv = await fetchUrl(defaultUrl);
      } catch (e) {
        try {
          const fallbackUrl = `https://docs.google.com/spreadsheets/d/${cleanSheetId}/export?format=csv&id=${cleanSheetId}&gid=0`;
          primaryCsv = await fetchUrl(fallbackUrl);
        } catch (err) {}
      }

      if (primaryCsv) {
        const primaryRows = parseCsv(primaryCsv);
        if (primaryRows.length > 0) {
          allRecords.push(...primaryRows);
        }
      }

      // 2. If primary sheet was empty, check named tabs (admin, giao_vien, hoc_sinh)
      if (allRecords.length === 0) {
        const sheetTabs = [
          { name: 'admin', role: 'admin' },
          { name: 'giao_vien', role: 'teacher' },
          { name: 'hoc_sinh', role: 'student' }
        ];

        for (const tab of sheetTabs) {
          try {
            const tabUrl = `https://docs.google.com/spreadsheets/d/${cleanSheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab.name)}`;
            const csvText = await fetchUrl(tabUrl);
            const rows = parseCsv(csvText);
            rows.forEach(r => { if (!r.role && !r.vai_tro) r.role = tab.role; });
            allRecords.push(...rows);
          } catch (tabErr) {
            // Tab not found
          }
        }
      }
    } else if (cleanCustomUrl) {
      sourceInfo = cleanCustomUrl;
      const csvData = await fetchUrl(cleanCustomUrl);
      const rows = parseCsv(csvData);
      allRecords.push(...rows);
    } else {
      throw new Error('Vui lòng cung cấp Google Sheet ID hợp lệ hoặc URL bảng tính công khai');
    }

    // Deduplicate records by username
    const seenUsernames = new Set();
    const uniqueRecords = [];
    for (const r of allRecords) {
      const u = (r.username || r.ten_dang_nhap || r.tai_khoan || r.user || '').toString().trim().toLowerCase();
      if (u && !seenUsernames.has(u)) {
        seenUsernames.add(u);
        uniqueRecords.push(r);
      }
    }
    allRecords = uniqueRecords;

    if (allRecords.length === 0) {
      throw new Error(
        'Bảng tính Google Sheets hiện tại chưa có dữ liệu tài khoản nào (hoặc chỉ có hàng tiêu đề trống). ' +
        'Vui lòng nhập danh sách tài khoản theo mẫu vào Google Sheets rồi bấm đồng bộ lại!'
      );
    }

    const result = syncAccountRecords(allRecords);

    // Save sync log
    const logDetails = JSON.stringify({
      source: sourceInfo,
      sheetId: cleanSheetId || null,
      total: result.totalProcessed,
      created: result.createdCount,
      updated: result.updatedCount,
      locked: result.lockedCount,
      adminProtectedCount: result.adminProtectedCount,
      adminNotes: result.adminNotes
    });

    db.prepare(`
      INSERT INTO sync_logs (sheet_id, records_synced, status, details, performed_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(cleanSheetId || cleanCustomUrl || 'GOOGLE_SHEETS', result.totalProcessed, 'success', logDetails, adminId || null);

    let message = `Đồng bộ thành công ${result.totalProcessed} tài khoản từ Google Sheets (${result.createdCount} mới, ${result.updatedCount} cập nhật, ${result.lockedCount} bị khóa)`;
    if (result.adminProtectedCount > 0) {
      message += ` • Bảo vệ an toàn ${result.adminProtectedCount} tài khoản Admin`;
    }

    return {
      success: true,
      message,
      data: result
    };
  } catch (error) {
    db.prepare(`
      INSERT INTO sync_logs (sheet_id, records_synced, status, details, performed_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(cleanSheetId || cleanCustomUrl || 'ERROR', 0, 'failed', JSON.stringify({ error: error.message }), adminId || null);

    throw error;
  }
}

module.exports = {
  extractSheetId,
  fetchUrl,
  parseCsv,
  normalizeKey,
  extractUserFields,
  syncAccountRecords,
  syncFromGoogleSheets
};
