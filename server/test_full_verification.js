const assert = require('assert');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// 1. Test googleSheetsService
const sheetsService = require('./services/googleSheetsService');
const db = require('./database/db');

console.log('====================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN GOOGLE SHEETS & ADMIN SECURITY');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}: ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(testName, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}: ${err.message}`);
    failedTests++;
  }
}

// ----------------------------------------------------
// TEST SUITE 1: Sheet ID Extraction from various inputs
// ----------------------------------------------------
console.log('--- TEST SUITE 1: Trích xuất Google Sheet ID ---');

const expectedId = '1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4';

runTest('Trích xuất từ raw ID sạch', () => {
  const result = sheetsService.extractSheetId('1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4');
  assert.strictEqual(result, expectedId);
});

runTest('Trích xuất từ raw ID có khoảng trắng và dấu nháy', () => {
  const result = sheetsService.extractSheetId('   "1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4"   \n');
  assert.strictEqual(result, expectedId);
});

runTest('Trích xuất từ full URL /edit?usp=sharing', () => {
  const url = 'https://docs.google.com/spreadsheets/d/1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4/edit?usp=sharing';
  const result = sheetsService.extractSheetId(url);
  assert.strictEqual(result, expectedId);
});

runTest('Trích xuất từ full URL /edit#gid=0', () => {
  const url = 'https://docs.google.com/spreadsheets/d/1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4/edit#gid=123456';
  const result = sheetsService.extractSheetId(url);
  assert.strictEqual(result, expectedId);
});

runTest('Trích xuất từ URL export CSV', () => {
  const url = 'https://docs.google.com/spreadsheets/d/1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4/export?format=csv&gid=0';
  const result = sheetsService.extractSheetId(url);
  assert.strictEqual(result, expectedId);
});

runTest('Trích xuất từ URL gviz/tq', () => {
  const url = 'https://docs.google.com/spreadsheets/d/1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4/gviz/tq?tqx=out:csv';
  const result = sheetsService.extractSheetId(url);
  assert.strictEqual(result, expectedId);
});

runTest('Trích xuất từ URL dạng published web /d/e/ID/pubhtml', () => {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR6EXAMPLE1234567890/pubhtml';
  const result = sheetsService.extractSheetId(url);
  assert.strictEqual(result, '2PACX-1vR6EXAMPLE1234567890');
});

// ----------------------------------------------------
// TEST SUITE 2: Header normalization & Vietnamese accents
// ----------------------------------------------------
console.log('\n--- TEST SUITE 2: Chuẩn hóa Header tiếng Việt & Tiếng Anh ---');

runTest('Chuẩn hóa đ/Đ tiếng Việt thành d', () => {
  assert.strictEqual(sheetsService.normalizeKey('Tên đăng nhập'), 'ten_dang_nhap');
  assert.strictEqual(sheetsService.normalizeKey('Địa chỉ email'), 'dia_chi_email');
  assert.strictEqual(sheetsService.normalizeKey('ĐÃ ĐỔI'), 'da_doi');
});

runTest('Chuẩn hóa các ký tự đặc biệt, dấu câu, khoảng trắng thừa', () => {
  assert.strictEqual(sheetsService.normalizeKey('  Họ & Tên (Học Viên)  '), 'ho_ten_hoc_vien');
  assert.strictEqual(sheetsService.normalizeKey('Mật khẩu / Password!'), 'mat_khau_password');
  assert.strictEqual(sheetsService.normalizeKey('Tình trạng/Trạng thái'), 'tinh_trang_trang_thai');
});

// ----------------------------------------------------
// TEST SUITE 3: CSV & TSV Parser
// ----------------------------------------------------
console.log('\n--- TEST SUITE 3: Phân tích cú pháp CSV / TSV ---');

runTest('Parse CSV chuẩn với dấu phẩy và quotes', () => {
  const csv = `username,password,full_name,email,role,status
"user1","pass,with,comma","Nguyen Van A",user1@test.com,student,active
user2,pass123,"Tran Thi B",user2@test.com,teacher,locked`;
  const rows = sheetsService.parseCsv(csv);
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[0].username, 'user1');
  assert.strictEqual(rows[0].password, 'pass,with,comma');
  assert.strictEqual(rows[0].full_name, 'Nguyen Van A');
  assert.strictEqual(rows[1].role, 'teacher');
  assert.strictEqual(rows[1].status, 'locked');
});

runTest('Parse TSV (Tab Delimited)', () => {
  const tsv = "tai_khoan\tmat_khau\tho_va_ten\tvai_tro\ttrang_thai\n" +
              "gv_nguyen\tpass123\tThầy Nguyễn\tgiao_vien\thoat_dong\n" +
              "hs_le\tpass123\tEm Lê\thoc_sinh\tkhoa";
  const rows = sheetsService.parseCsv(tsv);
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[0].tai_khoan, 'gv_nguyen');
  assert.strictEqual(rows[1].tai_khoan, 'hs_le');
});

// ----------------------------------------------------
// TEST SUITE 4: Field extraction with Vietnamese & English
// ----------------------------------------------------
console.log('\n--- TEST SUITE 4: Trích xuất trường thông tin tài khoản ---');

runTest('Trích xuất trường tiếng Anh chuẩn', () => {
  const record = {
    username: 'john_doe',
    password: 'securePass123',
    full_name: 'John Doe',
    email: 'john@example.com',
    role: 'teacher',
    status: 'active'
  };
  const fields = sheetsService.extractUserFields(record);
  assert.strictEqual(fields.username, 'john_doe');
  assert.strictEqual(fields.rawPassword, 'securePass123');
  assert.strictEqual(fields.fullName, 'John Doe');
  assert.strictEqual(fields.email, 'john@example.com');
  assert.strictEqual(fields.role, 'teacher');
  assert.strictEqual(fields.status, 'active');
});

runTest('Trích xuất trường tiếng Việt 1 (ten_dang_nhap, mat_khau, ho_va_ten, vai_tro, trang_thai)', () => {
  const record = {
    ten_dang_nhap: 'gv_vuong',
    mat_khau: 'gv123456',
    ho_va_ten: 'Vương Tuấn Kiệt',
    thu_dien_tu: 'kiet.vt@hskmaster.edu.vn',
    vai_tro: 'giáo viên',
    trang_thai: 'hoạt động'
  };
  const fields = sheetsService.extractUserFields(record);
  assert.strictEqual(fields.username, 'gv_vuong');
  assert.strictEqual(fields.rawPassword, 'gv123456');
  assert.strictEqual(fields.fullName, 'Vương Tuấn Kiệt');
  assert.strictEqual(fields.email, 'kiet.vt@hskmaster.edu.vn');
  assert.strictEqual(fields.role, 'teacher');
  assert.strictEqual(fields.status, 'active');
});

runTest('Trích xuất trường tiếng Việt 2 (tai_khoan, mk, ho_ten, chuc_vu, tinh_trang khóa)', () => {
  const record = {
    tai_khoan: 'hs_quocanh',
    mk: 'pass123',
    ho_ten: 'Nguyễn Quốc Anh',
    mail: 'quocanh@student.vn',
    chuc_vu: 'học sinh',
    tinh_trang: 'tạm khóa'
  };
  const fields = sheetsService.extractUserFields(record);
  assert.strictEqual(fields.username, 'hs_quocanh');
  assert.strictEqual(fields.fullName, 'Nguyễn Quốc Anh');
  assert.strictEqual(fields.role, 'student');
  assert.strictEqual(fields.status, 'locked');
});

runTest('Nhận diện đúng vai trò Admin từ các biến thể tiếng Việt (Quản trị, Root, Superadmin)', () => {
  const r1 = sheetsService.extractUserFields({ username: 'u1', vai_tro: 'quản trị viên' });
  const r2 = sheetsService.extractUserFields({ username: 'u2', quyen: 'SuperAdmin' });
  const r3 = sheetsService.extractUserFields({ username: 'u3', chuc_vu: 'Quản lý' });
  assert.strictEqual(r1.role, 'admin');
  assert.strictEqual(r2.role, 'admin');
  assert.strictEqual(r3.role, 'admin');
});

// ----------------------------------------------------
// TEST SUITE 5: Root 'admin' protection during Sync
// ----------------------------------------------------
console.log('\n--- TEST SUITE 5: Bảo vệ Quản trị viên chính khi đồng bộ Sheet ---');

runTest('Đồng bộ dữ liệu cố tình khóa hoặc hạ cấp admin (bị chặn tuyệt đối)', () => {
  // Lấy hash mật khẩu ban đầu của admin
  const currentAdmin = db.prepare('SELECT id, username, password_hash, role, status FROM users WHERE username = ?').get('admin');
  assert.ok(currentAdmin, 'Tài khoản admin phải tồn tại trong DB');
  const originalHash = currentAdmin.password_hash;

  // Thử đồng bộ record admin với status: locked, role: student, password: 'hacked_password'
  const maliciousRecord = [
    {
      username: 'admin',
      password: 'hacked_password_123',
      full_name: 'Admin Giả Mạo Bị Khóa',
      email: 'hacked@fake.com',
      role: 'student',
      status: 'locked'
    },
    {
      username: 'test_student_1',
      password: 'student_pass',
      full_name: 'Học Viên Test Sync',
      email: 'student1@test.com',
      role: 'student',
      status: 'active'
    }
  ];

  const syncResult = sheetsService.syncAccountRecords(maliciousRecord);

  // Kiểm tra kết quả sync
  assert.strictEqual(syncResult.adminProtectedCount, 1, 'Phải ghi nhận 1 lần bảo vệ tài khoản admin');
  assert.ok(syncResult.adminNotes.length > 0, 'Phải có ghi chú bảo vệ admin');

  // Kiểm tra trạng thái admin trong DB
  const afterAdmin = db.prepare('SELECT id, username, password_hash, role, status FROM users WHERE username = ?').get('admin');
  assert.strictEqual(afterAdmin.role, 'admin', 'Role của admin phải luôn giữ là admin, không bị hạ cấp thành student');
  assert.strictEqual(afterAdmin.status, 'active', 'Status của admin phải luôn giữ là active, không bao giờ bị locked');
  assert.strictEqual(afterAdmin.password_hash, originalHash, 'Password của root admin không được bị ghi đè bởi sheet ngoài');

  // Kiểm tra học sinh được nạp bình thường
  const student = db.prepare('SELECT username, role, status FROM users WHERE username = ?').get('test_student_1');
  assert.ok(student, 'Học sinh hợp lệ phải được tạo thành công');
  assert.strictEqual(student.role, 'student');
  assert.strictEqual(student.status, 'active');
});

// ----------------------------------------------------
// TEST SUITE 6: Database & Controller Security Protections
// ----------------------------------------------------
console.log('\n--- TEST SUITE 6: Bảo vệ Quản trị viên ở tầng Database & Controller ---');

runTest('Database UPDATE: Chặn chuyển status của admin thành "locked"', () => {
  const updateResult = db.prepare('UPDATE users SET status = ? WHERE id = ?').run('locked', 1);
  const admin = db.prepare('SELECT status FROM users WHERE id = 1').get();
  assert.strictEqual(admin.status, 'active', 'Trạng thái admin không được đổi sang locked qua UPDATE id = 1');
});

runTest('Database DELETE: Chặn xóa tài khoản admin theo id', () => {
  const deleteResult = db.prepare('DELETE FROM users WHERE id = ?').run(1);
  assert.strictEqual(deleteResult.changes, 0, 'DELETE admin theo ID phải trả về changes = 0');
  const admin = db.prepare('SELECT id FROM users WHERE id = 1').get();
  assert.ok(admin, 'Admin id = 1 vẫn phải tồn tại trong DB');
});

runTest('Database DELETE: Chặn xóa tài khoản admin theo username', () => {
  const deleteResult = db.prepare('DELETE FROM users WHERE username = ?').run('admin');
  assert.strictEqual(deleteResult.changes, 0, 'DELETE admin theo username phải trả về changes = 0');
  const admin = db.prepare('SELECT username FROM users WHERE username = ?').get('admin');
  assert.ok(admin, 'Admin username="admin" vẫn phải tồn tại trong DB');
});

// ----------------------------------------------------
// TEST SUITE 7: Controller Handlers for Admin Operations
// ----------------------------------------------------
console.log('\n--- TEST SUITE 7: Kiểm tra Controller API Handlers ---');

const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const sheetsSyncController = require('./controllers/sheetsSyncController');

function createMockReqRes(body = {}, params = {}, query = {}, user = null) {
  const req = { body, params, query, user, ip: '127.0.0.1' };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData
  };

  return { req, res };
}

runTest('userController.updateUserStatus: Từ chối khóa Quản trị viên (403 Forbidden)', () => {
  const { req, res } = createMockReqRes({ status: 'locked' }, { id: '1' }, {}, { id: 1, username: 'admin', role: 'admin' });
  userController.updateUserStatus(req, res);
  assert.strictEqual(res.getStatusCode(), 403);
  assert.strictEqual(res.getData().success, false);
  assert.ok(res.getData().message.includes('bảo vệ'));
});

runTest('userController.deleteUser: Từ chối xóa Quản trị viên (403 Forbidden)', () => {
  const { req, res } = createMockReqRes({}, { id: '1' }, {}, { id: 1, username: 'admin', role: 'admin' });
  userController.deleteUser(req, res);
  assert.strictEqual(res.getStatusCode(), 403);
  assert.strictEqual(res.getData().success, false);
});

// ----------------------------------------------------
// TEST SUITE 8: Admin Profile Update, Password Change & Login
// ----------------------------------------------------
console.log('\n--- TEST SUITE 8: Cập nhật thông tin Quản trị viên, Đổi mật khẩu & Đăng nhập ---');

runTest('Đăng nhập ban đầu với admin / admin123', () => {
  const { req, res } = createMockReqRes({ username: 'admin', password: 'admin123' });
  authController.login(req, res);
  assert.strictEqual(res.getStatusCode(), 200);
  assert.strictEqual(res.getData().success, true);
  assert.ok(res.getData().token, 'Phải sinh ra JWT token');
  assert.strictEqual(res.getData().user.username, 'admin');
  assert.strictEqual(res.getData().user.role, 'admin');
});

runTest('Cập nhật Admin Profile (Họ tên, Email mới, Mật khẩu mới)', () => {
  const adminUser = db.prepare('SELECT id, username, full_name, email, role, status FROM users WHERE id = 1').get();
  const { req, res } = createMockReqRes({
    full_name: 'Quản Trị Viên Trưởng (Verified)',
    email: 'admin.verified@hskmaster.edu.vn',
    new_password: 'new_admin_password_2026',
    current_password: 'admin123'
  }, {}, {}, adminUser);

  authController.updateAdminProfile(req, res);
  assert.strictEqual(res.getStatusCode(), 200);
  assert.strictEqual(res.getData().success, true);
  assert.strictEqual(res.getData().user.full_name, 'Quản Trị Viên Trưởng (Verified)');
  assert.strictEqual(res.getData().user.email, 'admin.verified@hskmaster.edu.vn');
});

runTest('Đăng nhập bằng mật khẩu cũ (admin123) phải bị từ chối 401', () => {
  const { req, res } = createMockReqRes({ username: 'admin', password: 'admin123' });
  authController.login(req, res);
  assert.strictEqual(res.getStatusCode(), 401);
  assert.strictEqual(res.getData().success, false);
});

runTest('Đăng nhập bằng mật khẩu mới (new_admin_password_2026) phải thành công', () => {
  const { req, res } = createMockReqRes({ username: 'admin', password: 'new_admin_password_2026' });
  authController.login(req, res);
  assert.strictEqual(res.getStatusCode(), 200);
  assert.strictEqual(res.getData().success, true);
  assert.ok(res.getData().token);
});

runTest('Khôi phục lại mật khẩu admin chuẩn (admin123) qua authController.changePassword', () => {
  const adminUser = db.prepare('SELECT id, username, role FROM users WHERE id = 1').get();
  const { req, res } = createMockReqRes({
    old_password: 'new_admin_password_2026',
    new_password: 'admin123'
  }, {}, {}, adminUser);

  authController.changePassword(req, res);
  assert.strictEqual(res.getStatusCode(), 200);
  assert.strictEqual(res.getData().success, true);

  // Đăng nhập lại với admin123
  const { req: lReq, res: lRes } = createMockReqRes({ username: 'admin', password: 'admin123' });
  authController.login(lReq, lRes);
  assert.strictEqual(lRes.getStatusCode(), 200);
  assert.strictEqual(lRes.getData().success, true);
});

// ----------------------------------------------------
// TEST SUITE 9: sheetsSyncController directSyncData
// ----------------------------------------------------
console.log('\n--- TEST SUITE 9: sheetsSyncController.directSyncData (CSV Text & Account Array) ---');

runTest('directSyncData với csvText tiếng Việt', async () => {
  const csvText = `ten_dang_nhap,mat_khau,ho_va_ten,email,vai_tro,trang_thai
gv_kiemthu,pass123,Giáo Viên Kiểm Thử,gv.kt@test.vn,giao_vien,active
hs_kiemthu,pass123,Học Sinh Kiểm Thử,hs.kt@test.vn,hoc_sinh,active`;

  const { req, res } = createMockReqRes({ csvText }, {}, {}, { id: 1, username: 'admin', role: 'admin' });
  await sheetsSyncController.directSyncData(req, res);
  assert.strictEqual(res.getStatusCode(), 200);
  assert.strictEqual(res.getData().success, true);
  assert.strictEqual(res.getData().data.totalProcessed, 2);

  const gv = db.prepare('SELECT username, role FROM users WHERE username = "gv_kiemthu"').get();
  assert.ok(gv);
  assert.strictEqual(gv.role, 'teacher');
});

runTest('directSyncData với accounts array', async () => {
  const accounts = [
    { username: 'hs_array1', password: 'p1', full_name: 'Học Sinh Array 1', role: 'student', status: 'active' },
    { username: 'hs_array2', password: 'p2', full_name: 'Học Sinh Array 2', role: 'student', status: 'locked' }
  ];

  const { req, res } = createMockReqRes({ accounts }, {}, {}, { id: 1, username: 'admin', role: 'admin' });
  await sheetsSyncController.directSyncData(req, res);
  assert.strictEqual(res.getStatusCode(), 200);
  assert.strictEqual(res.getData().success, true);
  assert.strictEqual(res.getData().data.totalProcessed, 2);
  assert.strictEqual(res.getData().data.lockedCount, 1);
});

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ:`);
console.log(`   - Tổng số test: ${passedTests + failedTests}`);
console.log(`   - Thành công:   ${passedTests}`);
console.log(`   - Thất bại:     ${failedTests}`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100%!');
  process.exit(0);
}
