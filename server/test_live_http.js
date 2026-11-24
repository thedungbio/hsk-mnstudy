const http = require('http');
const assert = require('assert');

function httpRequest({ path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runLiveTests() {
  console.log('====================================================');
  console.log('🚀 KIỂM THỬ TÍCH HỢP HTTP TRỰC TIẾP TRÊN SERVER PORT 5000');
  console.log('====================================================\n');

  // 1. Health check
  console.log('1. Kiểm tra /api/health...');
  const healthRes = await httpRequest({ path: '/api/health' });
  assert.strictEqual(healthRes.status, 200);
  assert.strictEqual(healthRes.data.status, 'ONLINE');
  console.log('   ✅ [PASS] /api/health trả về 200 ONLINE');

  // 2. Admin Login
  console.log('2. Đăng nhập Admin...');
  const loginRes = await httpRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { username: 'admin', password: 'admin123' }
  });
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.data.success, true);
  const token = loginRes.data.token;
  assert.ok(token, 'Token phải tồn tại');
  console.log('   ✅ [PASS] Đăng nhập admin thành công, nhận token');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Test Google Sheets Sync with full URL
  console.log('3. Đồng bộ Google Sheets qua full URL...');
  const syncRes = await httpRequest({
    path: '/api/sheets/sync',
    method: 'POST',
    headers: authHeaders,
    body: {
      sheetId: 'https://docs.google.com/spreadsheets/d/1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4/edit?usp=sharing'
    }
  });
  assert.strictEqual(syncRes.status, 200);
  assert.strictEqual(syncRes.data.success, true);
  console.log(`   ✅ [PASS] Đồng bộ Google Sheets thành công: ${syncRes.data.message}`);

  // 4. Test direct sync with Vietnamese CSV and Admin Protection
  console.log('4. Đồng bộ trực tiếp CSV tiếng Việt cố ý khóa Admin...');
  const directSyncRes = await httpRequest({
    path: '/api/sheets/direct-sync',
    method: 'POST',
    headers: authHeaders,
    body: {
      csvText: `ten_dang_nhap,mat_khau,ho_va_ten,vai_tro,trang_thai
admin,hackpass,Admin Fake Bi Khoa,quan_tri,khoa
gv_vietnam,pass123,Cô Nguyễn Hải Yến,giao_vien,active
hs_vietnam,pass123,Học Viên Trần Nam,hoc_sinh,active`
    }
  });
  assert.strictEqual(directSyncRes.status, 200);
  assert.strictEqual(directSyncRes.data.success, true);
  assert.strictEqual(directSyncRes.data.data.adminProtectedCount, 1);
  console.log(`   ✅ [PASS] Đồng bộ trực tiếp thành công và bảo vệ an toàn Admin: ${directSyncRes.data.message}`);

  // 5. Test Lock Admin via API (Must return 403)
  console.log('5. Thử khóa Admin qua PATCH /api/users/1/status (phải bị từ chối 403)...');
  const lockAdminRes = await httpRequest({
    path: '/api/users/1/status',
    method: 'PATCH',
    headers: authHeaders,
    body: { status: 'locked' }
  });
  assert.strictEqual(lockAdminRes.status, 403);
  assert.strictEqual(lockAdminRes.data.success, false);
  console.log(`   ✅ [PASS] Khóa Admin bị từ chối 403 với thông báo: "${lockAdminRes.data.message}"`);

  // 6. Test Admin Profile Update
  console.log('6. Cập nhật hồ sơ Admin qua PUT /api/auth/profile...');
  const profileRes = await httpRequest({
    path: '/api/auth/profile',
    method: 'PUT',
    headers: authHeaders,
    body: {
      full_name: 'Quản Trị Viên Trưởng HSK',
      email: 'admin.lead@hskmaster.edu.vn'
    }
  });
  assert.strictEqual(profileRes.status, 200);
  assert.strictEqual(profileRes.data.success, true);
  assert.strictEqual(profileRes.data.user.full_name, 'Quản Trị Viên Trưởng HSK');
  console.log(`   ✅ [PASS] Cập nhật Admin profile thành công: ${profileRes.data.message}`);

  // 7. Test Serving SPA Frontend Dist
  console.log('7. Kiểm tra Static SPA HTML phục vụ tại / ...');
  const spaRes = await httpRequest({ path: '/' });
  assert.strictEqual(spaRes.status, 200);
  assert.ok(typeof spaRes.data === 'string' && spaRes.data.includes('<div id="root"></div>'));
  console.log('   ✅ [PASS] Frontend SPA index.html được phục vụ chuẩn xác với mã 200');

  console.log('\n====================================================');
  console.log('🎉 TOÀN BỘ 7 BƯỚC KIỂM THỬ HTTP TRỰC TIẾP ĐÃ VƯỢT QUA 100%!');
  console.log('====================================================');
}

runLiveTests().catch((err) => {
  console.error('❌ Lỗi kiểm thử live HTTP:', err);
  process.exit(1);
});
