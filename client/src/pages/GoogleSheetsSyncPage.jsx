import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileSpreadsheet, RefreshCw, CheckCircle2, AlertCircle, 
  ShieldCheck, GraduationCap, User, Lock, Unlock, Clock,
  ExternalLink, Sparkles, Copy, Check, Info, Search,
  FileText, ShieldAlert, KeyRound, Users, Trash2
} from 'lucide-react';

/**
 * Client-side helper to extract Sheet ID from URL or raw input
 */
function extractSheetIdClient(input) {
  if (!input || typeof input !== 'string') return '';
  const str = input.trim().replace(/^["']|["']$/g, '').trim();

  const dMatch = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]{15,})/i);
  if (dMatch && dMatch[1]) return dMatch[1].trim();

  const eMatch = str.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]{15,})/i);
  if (eMatch && eMatch[1]) return eMatch[1].trim();

  const paramMatch = str.match(/[?&](?:id|key)=([a-zA-Z0-9-_]{15,})/i);
  if (paramMatch && paramMatch[1]) return paramMatch[1].trim();

  if (str.includes('/')) {
    const cleanUrl = str.split('?')[0].split('#')[0];
    const parts = cleanUrl.split('/').filter(p => p.length >= 15 && !p.includes('.') && !p.includes(':'));
    if (parts.length > 0) return parts[parts.length - 1].trim();
  }

  return str.replace(/^[^\w-]+|[^\w-]+$/g, '').trim();
}

export default function GoogleSheetsSyncPage() {
  const [inputVal, setInputVal] = useState('1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4');
  const [sheetId, setSheetId] = useState('1qem8T4Ll-Fu2EjATnMZFWw_SMD_jjBP2ZRscDDB3ZD4');
  const [extractedNotice, setExtractedNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'student' | 'teacher' | 'admin'
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [syncMode, setSyncMode] = useState('sheet'); // 'sheet' | 'direct'

  // Direct paste state
  const [directText, setDirectText] = useState('');
  const [directLoading, setDirectLoading] = useState(false);

  const fetchUsersAndLogs = async () => {
    try {
      const [uRes, lRes] = await Promise.all([
        api.getUsers('?limit=200'),
        api.getSyncLogs()
      ]);
      if (uRes.success) setUsers(uRes.users);
      if (lRes.success) setLogs(lRes.logs);
    } catch (e) {
      console.error('Lỗi nạp dữ liệu:', e);
    }
  };

  useEffect(() => {
    fetchUsersAndLogs();
  }, []);

  // Handle Sheet ID / URL change & auto-extract
  const handleInputChange = (val) => {
    setInputVal(val);
    const cleaned = extractSheetIdClient(val);
    if (val.includes('http') || val.includes('/spreadsheets/')) {
      setExtractedNotice(true);
      setSheetId(cleaned);
    } else {
      setExtractedNotice(false);
      setSheetId(cleaned);
    }
  };

  // Sync from Google Sheets URL / ID
  const handleSync = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setSyncResult(null);

    const cleanId = extractSheetIdClient(inputVal);

    try {
      const res = await api.syncSheets({
        sheetId: cleanId || null,
        customUrl: inputVal.startsWith('http') ? inputVal.trim() : null
      });
      setSyncResult(res);
      await fetchUsersAndLogs();
    } catch (err) {
      setError(err.message || 'Quá trình đồng bộ từ Google Sheets thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Direct paste sync
  const handleDirectSync = async () => {
    if (!directText.trim()) {
      setError('Vui lòng dán dữ liệu danh sách tài khoản dạng CSV hoặc bảng tính');
      return;
    }
    setDirectLoading(true);
    setError('');
    setSyncResult(null);

    try {
      const res = await api.directSync({ csvText: directText.trim() });
      setSyncResult(res);
      await fetchUsersAndLogs();
    } catch (err) {
      setError(err.message || 'Lỗi đồng bộ trực tiếp');
    } finally {
      setDirectLoading(false);
    }
  };

  // Sample CSV Templates
  const sampleCsvEnglish = `username,password,full_name,email,role,status
admin_hsk,admin123,Quản Trị Viên Trưởng,admin@hsk.edu.vn,admin,active
gv_vuongcuong,teacher123,Thầy Vương Cường (王强),vuongcuong@hsk.edu.vn,teacher,active
gv_truongle,teacher123,Cô Trương Lệ (张丽),truongle@hsk.edu.vn,teacher,active
hs_minhanh,student123,Nguyễn Minh Anh,minhanh@student.vn,student,active
hs_phuongthao,student123,Trần Phương Thảo,thao.tp@student.vn,student,active
hs_hoangnam,student123,Hoàng Nam (HSK 3),nam.h@student.vn,student,active
hs_quocanh,student123,Nguyễn Quốc Anh (Tạm Khóa),quocanh@student.vn,student,locked`;

  const sampleCsvVietnamese = `ten_dang_nhap,mat_khau,ho_va_ten,email,vai_tro,trang_thai
admin_hethong,admin123,Quản Trị Viên HSK,quantri@hskmaster.edu.vn,admin,active
giaovien_lan,teacher123,Cô Nguyễn Thị Lan,lan.nguyen@hskmaster.edu.vn,giao_vien,active
giaovien_hoang,teacher123,Thầy Hoàng Minh,hoang.m@hskmaster.edu.vn,giao_vien,active
hocsinh_quangminh,student123,Trần Quang Minh,minh.tq@student.vn,hoc_sinh,active
hocsinh_thuyduong,student123,Lê Thùy Dương,duong.lt@student.vn,hoc_sinh,active
hocsinh_dinhkhoa,student123,Phạm Đình Khoa (Bị Khóa),khoa.pd@student.vn,hoc_sinh,khoa`;

  const handleCopySample = (type = 'en') => {
    const text = type === 'vi' ? sampleCsvVietnamese : sampleCsvEnglish;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLoadSampleToDirect = (type = 'en') => {
    setDirectText(type === 'vi' ? sampleCsvVietnamese : sampleCsvEnglish);
    setSyncMode('direct');
  };

  // Toggle User Status (Lock / Unlock)
  const handleToggleStatus = async (id, currentStatus, username) => {
    // Root Admin security check
    if (id === 1 || username === 'admin') {
      alert('Tài khoản Quản trị viên tối cao (admin) được bảo vệ vĩnh viễn và không thể bị khóa!');
      return;
    }
    const nextStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      await api.updateUserStatus(id, nextStatus);
      await fetchUsersAndLogs();
    } catch (err) {
      alert(`Lỗi cập nhật trạng thái: ${err.message}`);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (id === 1 || username === 'admin') {
      alert('Tài khoản Quản trị viên tối cao (admin) được bảo vệ vĩnh viễn và không thể xóa!');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${username}" khỏi hệ thống?`)) {
      return;
    }
    try {
      const res = await api.deleteUser(id);
      if (res.success) {
        await fetchUsersAndLogs();
      } else {
        alert(res.message || 'Lỗi khi xóa tài khoản');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa tài khoản');
    }
  };

  // Filter users by role and search
  const filteredUsers = users.filter((u) => {
    const matchesTab = activeTab === 'all' || u.role === activeTab;
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query ||
      u.username?.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  const activeSheetId = sheetId || extractSheetIdClient(inputVal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Đồng Bộ Tài Khoản Google Sheets & Dữ Liệu
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Auto-Extract ID
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Hỗ trợ dán trực tiếp URL Google Sheets, tự động trích xuất ID, nhận diện tiêu đề tiếng Việt/tiếng Anh và <strong>bảo vệ vĩnh viễn tài khoản quản trị Admin</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${activeSheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100 flex items-center gap-2 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở Google Sheet</span>
            </a>
          )}

          <button
            onClick={() => handleLoadSampleToDirect('vi')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 text-white font-semibold text-xs shadow-sm flex items-center gap-2 shrink-0 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Nạp Mẫu Tiếng Việt</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSyncMode('sheet')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            syncMode === 'sheet'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Đồng bộ từ Google Sheets URL / ID</span>
        </button>
        <button
          onClick={() => setSyncMode('direct')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            syncMode === 'direct'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Dán Dữ Liệu Nhanh (Direct Quick-Sync)</span>
        </button>
      </div>

      {/* Mode 1: Google Sheets URL / ID */}
      {syncMode === 'sheet' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Kết nối Google Sheets (Hỗ trợ URL đầy đủ hoặc Sheet ID)</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Tự động nhận diện các tab: <code>admin</code>, <code>giao_vien</code>, <code>hoc_sinh</code> hoặc trang mặc định
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {extractedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Đã tự động trích xuất Sheet ID: <strong className="font-mono">{sheetId}</strong> từ liên kết Google Sheets đã dán!
              </span>
            </div>
          )}

          <form onSubmit={handleSync} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Nhập hoặc Dán Liên Kết Google Sheets (hoặc Sheet ID)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Dán URL https://docs.google.com/spreadsheets/d/.../edit hoặc Sheet ID..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Đang đồng bộ...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Đồng Bộ Google Sheets</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mode 2: Direct Quick-Sync Paste Textarea */}
      {syncMode === 'direct' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Dán Trực Tiếp Bảng Tài Khoản (CSV / TSV / Excel Copy)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bạn có thể sao chép trực tiếp các ô từ Excel/Google Sheets rồi dán vào đây để đồng bộ ngay lập tức!
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleLoadSampleToDirect('vi')}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Mẫu Tiếng Việt
              </button>
              <button
                type="button"
                onClick={() => handleLoadSampleToDirect('en')}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Mẫu Tiếng Anh
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <textarea
              rows={7}
              value={directText}
              onChange={(e) => setDirectText(e.target.value)}
              placeholder="Dán dữ liệu CSV hoặc copy từ bảng tính vào đây...
Ví dụ:
ten_dang_nhap,mat_khau,ho_va_ten,email,vai_tro,trang_thai
hocsinh1,123456,Nguyễn Văn A,a@student.vn,hoc_sinh,active"
              className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {directText.trim() ? `Khoảng ${directText.trim().split(/\r?\n/).length - 1} dòng dữ liệu` : 'Chưa có nội dung dán'}
              </span>

              <button
                type="button"
                onClick={handleDirectSync}
                disabled={directLoading || !directText.trim()}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {directLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang nạp dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Đồng Bộ Nhanh Trực Tiếp Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Result Notification & Statistics */}
      {syncResult && (
        <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{syncResult.message}</span>
            </div>
          </div>

          {syncResult.data?.adminProtectedCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Bảo vệ an toàn Admin:</strong> Tài khoản quản trị gốc (admin) được hệ thống bảo toàn quyền hạn tối cao, trạng thái hoạt động và mật khẩu.
              </span>
            </div>
          )}

          {/* Quick Stat badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-200/50">
              <div className="text-slate-400 text-[10px]">Tổng xử lý</div>
              <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                {syncResult.data?.totalProcessed || 0}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-200/50">
              <div className="text-slate-400 text-[10px]">Tạo mới</div>
              <div className="text-base font-bold text-emerald-600">
                {syncResult.data?.createdCount || 0}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-200/50">
              <div className="text-slate-400 text-[10px]">Cập nhật</div>
              <div className="text-base font-bold text-blue-600">
                {syncResult.data?.updatedCount || 0}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-200/50">
              <div className="text-slate-400 text-[10px]">Đã khóa</div>
              <div className="text-base font-bold text-rose-600">
                {syncResult.data?.lockedCount || 0}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-200/50">
              <div className="text-slate-400 text-[10px]">Bảo vệ Admin</div>
              <div className="text-base font-bold text-amber-600">
                {syncResult.data?.adminProtectedCount || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guide & Sample Data */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Hướng dẫn định dạng cột Google Sheets & Clipboard:
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopySample('vi')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 font-semibold text-xs hover:bg-teal-50 flex items-center gap-1.5 shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Sao chép mẫu Tiếng Việt</span>
            </button>
            <button
              onClick={() => handleCopySample('en')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 font-semibold text-xs hover:bg-emerald-50 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép mẫu Tiếng Anh</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Hệ thống nhận diện cả <strong>Tiêu đề Tiếng Việt</strong> (<code>ten_dang_nhap</code>, <code>mat_khau</code>, <code>ho_va_ten</code>, <code>email</code>, <code>vai_tro</code>, <code>trang_thai</code>) và <strong>Tiêu đề Tiếng Anh</strong> (<code>username</code>, <code>password</code>, <code>full_name</code>, <code>email</code>, <code>role</code>, <code>status</code>).
        </p>

        {/* Sample table preview */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500">
              <tr>
                <th className="p-2.5">Tên đăng nhập (username)</th>
                <th className="p-2.5">Mật khẩu (password)</th>
                <th className="p-2.5">Họ và tên (full_name)</th>
                <th className="p-2.5">Email</th>
                <th className="p-2.5">Vai trò (role)</th>
                <th className="p-2.5">Trạng thái (status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              <tr>
                <td className="p-2 font-bold text-teal-600">admin_hsk</td>
                <td className="p-2">admin123</td>
                <td className="p-2 font-sans">Quản Trị Viên Trưởng</td>
                <td className="p-2 font-sans">admin@hsk.edu.vn</td>
                <td className="p-2 font-bold text-rose-600">admin</td>
                <td className="p-2 text-emerald-600 font-bold">active</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-teal-600">gv_vuongcuong</td>
                <td className="p-2">teacher123</td>
                <td className="p-2 font-sans">Thầy Vương Cường (王强)</td>
                <td className="p-2 font-sans">vuongcuong@hsk.edu.vn</td>
                <td className="p-2 font-bold text-amber-600">teacher</td>
                <td className="p-2 text-emerald-600 font-bold">active</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-teal-600">hs_minhanh</td>
                <td className="p-2">student123</td>
                <td className="p-2 font-sans">Nguyễn Minh Anh</td>
                <td className="p-2 font-sans">minhanh@student.vn</td>
                <td className="p-2 font-bold text-teal-600">student</td>
                <td className="p-2 text-emerald-600 font-bold">active</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-teal-600">hs_quocanh</td>
                <td className="p-2">student123</td>
                <td className="p-2 font-sans">Nguyễn Quốc Anh (Bị Khóa)</td>
                <td className="p-2 font-sans">quocanh@student.vn</td>
                <td className="p-2 font-bold text-teal-600">student</td>
                <td className="p-2 text-rose-600 font-bold">locked</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Internal Database Users List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <span>Danh Sách Tài Khoản Trong Database ({users.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tài khoản quản trị gốc (admin) được hệ thống khóa cứng bảo vệ, không thể bị vô hiệu hóa hoặc xóa.
            </p>
          </div>

          {/* Search & Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tài khoản..."
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-48"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'all' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500'
                }`}
              >
                Tất cả ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('student')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'student' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Học Sinh ({users.filter(u => u.role === 'student').length})
              </button>
              <button
                onClick={() => setActiveTab('teacher')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'teacher' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Giáo Viên ({users.filter(u => u.role === 'teacher').length})
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'admin' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Quản Trị ({users.filter(u => u.role === 'admin').length})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Tên đăng nhập</th>
                <th className="p-3.5">Họ và tên</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Vai trò</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isRootAdmin = u.id === 1 || u.username === 'admin';

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isRootAdmin
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="p-3.5 font-mono text-slate-400">#{u.id}</td>
                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{u.username}</span>
                          {isRootAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-amber-600" />
                              Root
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-medium">{u.full_name}</td>
                      <td className="p-3.5 text-slate-500">{u.email || '—'}</td>
                      <td className="p-3.5">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                            <ShieldCheck className="w-3 h-3" /> Quản Trị
                          </span>
                        ) : u.role === 'teacher' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <GraduationCap className="w-3 h-3" /> Giáo Viên
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                            <User className="w-3 h-3" /> Học Sinh
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}
                        >
                          {u.status === 'active' ? (
                            <>
                              <Unlock className="w-3 h-3" /> Hoạt Động
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" /> Đã Khóa
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {isRootAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            Bảo vệ vĩnh viễn
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(u.id, u.status, u.username)}
                              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                                u.status === 'active'
                                  ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                            >
                              {u.status === 'active' ? 'Khóa' : 'Mở khóa'}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              title="Xóa vĩnh viễn tài khoản"
                              className="px-2.5 py-1 rounded-lg font-semibold text-[11px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Logs */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-500" />
          <span>Nhật Ký Đồng Bộ Google Sheets & Direct Sync (Sync Logs)</span>
        </h3>

        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              Chưa có lịch sử đồng bộ nào.
            </div>
          ) : (
            logs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    Nguồn: {log.sheet_id}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Thời gian: {new Date(log.created_at).toLocaleString('vi-VN')} • Thực hiện bởi: {log.performed_by_name || 'Hệ thống'}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {log.status === 'success' ? `Thành công (${log.records_synced} bản ghi)` : 'Thất bại'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
