const sheetsService = require('../services/googleSheetsService');
const db = require('../database/db');

/**
 * Handle Google Sheets URL / Sheet ID synchronization
 */
exports.syncSheets = async (req, res) => {
  try {
    const { sheetId, customUrl } = req.body;

    if (!sheetId && !customUrl) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp Google Sheet ID hoặc URL bảng tính công khai'
      });
    }

    // Auto extract clean Sheet ID if provided as full URL or raw ID
    const rawInput = (sheetId || '').trim();
    const cleanSheetId = rawInput ? sheetsService.extractSheetId(rawInput) : null;
    const cleanCustomUrl = customUrl ? customUrl.trim() : null;

    const result = await sheetsService.syncFromGoogleSheets({
      sheetId: cleanSheetId || rawInput || null,
      customUrl: cleanCustomUrl,
      adminId: req.user ? req.user.id : null
    });

    res.json(result);
  } catch (error) {
    console.error('Lỗi đồng bộ Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Quá trình đồng bộ thất bại'
    });
  }
};

/**
 * Direct sync for pasted CSV, TSV or account array
 */
exports.directSyncData = async (req, res) => {
  try {
    const { accounts, csvText, defaultRole } = req.body;

    let targetAccounts = [];

    if (csvText && typeof csvText === 'string') {
      targetAccounts = sheetsService.parseCsv(csvText);
    } else if (Array.isArray(accounts)) {
      targetAccounts = accounts;
    }

    if (!Array.isArray(targetAccounts) || targetAccounts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu danh sách tài khoản không hợp lệ hoặc rỗng. Vui lòng kiểm tra lại định dạng dữ liệu.'
      });
    }

    const result = sheetsService.syncAccountRecords(targetAccounts, defaultRole);

    const logDetails = JSON.stringify({
      source: 'DIRECT_IMPORT',
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
    `).run('DIRECT_IMPORT', result.totalProcessed, 'success', logDetails, req.user ? req.user.id : null);

    let message = `Đồng bộ thành công ${result.totalProcessed} tài khoản (${result.createdCount} mới, ${result.updatedCount} cập nhật, ${result.lockedCount} bị khóa)`;
    if (result.adminProtectedCount > 0) {
      message += ` • Bảo vệ an toàn ${result.adminProtectedCount} tài khoản Admin`;
    }

    res.json({
      success: true,
      message,
      data: result
    });
  } catch (error) {
    console.error('Lỗi đồng bộ trực tiếp:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get synchronization logs
 */
exports.getSyncLogs = (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT s.*, u.full_name as performed_by_name
      FROM sync_logs s
      LEFT JOIN users u ON s.performed_by = u.id
      ORDER BY s.created_at DESC
      LIMIT 50
    `).all();

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
