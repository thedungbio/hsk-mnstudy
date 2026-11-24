import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users, UserPlus, Lock, Unlock, Search, 
  ShieldCheck, GraduationCap, User, RefreshCw, CheckCircle2, AlertCircle, Trash2
} from 'lucide-react';

export default function UsersManagementPage() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form tạo tài khoản
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [createMsg, setCreateMsg] = useState('');
  const [createError, setCreateError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    let params = '?limit=100';
    if (roleFilter) params += `&role=${roleFilter}`;
    if (search) params += `&search=${encodeURIComponent(search)}`;

    api.getUsers(params)
      .then(res => {
        if (res.success) setUsers(res.users);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      await api.updateUserStatus(id, nextStatus);
      fetchUsers();
    } catch (err) {
      alert(`Lỗi cập nhật trạng thái: ${err.message}`);
    }
  };

  const handleDeleteUser = async (id, uname) => {
    if (uname === 'admin' || id === 1) {
      alert('Tài khoản Quản trị viên gốc được bảo vệ an toàn, không thể xóa!');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${uname}" khỏi hệ thống?`)) {
      return;
    }
    try {
      const res = await api.deleteUser(id);
      if (res.success) {
        fetchUsers();
      } else {
        alert(res.message || 'Lỗi khi xóa tài khoản');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa tài khoản');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateMsg('');
    setCreateError('');

    try {
      const res = await api.createUser({
        username: newUsername,
        password: newPassword,
        full_name: newFullName,
        email: newEmail,
        role: newRole
      });

      if (res.success) {
        setCreateMsg(res.message);
        setNewUsername('');
        setNewPassword('');
        setNewFullName('');
        setNewEmail('');
        fetchUsers();
        setTimeout(() => setShowCreateModal(false), 1200);
      }
    } catch (err) {
      setCreateError(err.message || 'Lỗi khi tạo tài khoản');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Quản Trị Người Dùng & Phân Quyền
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Quản lý tài khoản Admin, Giáo viên và Học sinh. Kiểm soát trạng thái hoạt động và quyền hạn truy cập.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold text-xs shadow-sm hover:from-teal-600 flex items-center gap-2 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Tài Khoản Mới</span>
        </button>
      </div>

      {/* Lọc & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setRoleFilter('')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              roleFilter === '' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Tất Cả ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('student')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              roleFilter === 'student' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Học Sinh
          </button>
          <button
            onClick={() => setRoleFilter('teacher')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              roleFilter === 'teacher' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Giáo Viên
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              roleFilter === 'admin' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Admin
          </button>
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo username, tên, email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Bảng Danh sách Người Dùng */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
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
                <th className="p-3.5">Ngày tạo</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400">#{u.id}</td>
                  <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {u.username}
                  </td>
                  <td className="p-3.5 font-medium">{u.full_name}</td>
                  <td className="p-3.5 text-slate-500">{u.email || '—'}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      u.role === 'admin'
                        ? 'bg-rose-100 text-rose-700'
                        : u.role === 'teacher'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      u.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {u.status === 'active' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}</span>
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(u.id, u.status)}
                      disabled={u.username === 'admin' || u.id === 1}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        u.status === 'active'
                          ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                      }`}
                    >
                      {u.status === 'active' ? 'Khóa' : 'Mở khóa'}
                    </button>

                    <button
                      onClick={() => handleDeleteUser(u.id, u.username)}
                      disabled={u.username === 'admin' || u.id === 1}
                      title={u.username === 'admin' ? 'Tài khoản admin gốc được bảo vệ' : 'Xóa tài khoản'}
                      className="px-2.5 py-1 rounded-lg font-semibold text-[11px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Tài Khoản Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <span>Thêm Tài Khoản Người Dùng Mới</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {createMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{createMsg}</span>
              </div>
            )}

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Tên đăng nhập (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ví dụ: hocsinh_ngoc"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Mật khẩu khởi tạo *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Họ và tên người dùng *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh Ngọc"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ngoc@student.vn"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Vai trò (Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="student">Học Sinh (Student)</option>
                  <option value="teacher">Giáo Viên (Teacher)</option>
                  <option value="admin">Quản Trị Viên (Admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold"
                >
                  Lưu Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
