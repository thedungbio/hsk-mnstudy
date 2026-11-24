import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, Moon, LogOut, Bot, User, ShieldCheck, 
  GraduationCap, Sparkles, Menu
} from 'lucide-react';

export default function Navbar({ onOpenAiTutor, activeTab, onSelectTab, onToggleMobileMenu }) {
  const { user, logout, darkMode, toggleDarkMode, isAdmin, isTeacher } = useAuth();

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
          <ShieldCheck className="w-3 h-3" /> <span className="hidden sm:inline">Quản Trị Viên</span><span className="sm:hidden">Admin</span>
        </span>
      );
    }
    if (isTeacher) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <GraduationCap className="w-3 h-3" /> <span className="hidden sm:inline">Giáo Viên</span><span className="sm:hidden">GV</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
        <User className="w-3 h-3" /> <span className="hidden sm:inline">Học Sinh</span><span className="sm:hidden">Học viên</span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      {/* Trái: Nút Hamburger trên điện thoại & Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Nút Hamburger mở menu trên điện thoại */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
          aria-label="Mở Menu Điều Hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo Icon */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md shadow-teal-500/20 font-chinese shrink-0">
          汉
        </div>

        {/* Brand Title */}
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 dark:from-teal-400 dark:to-cyan-300 bg-clip-text text-transparent">
              HSKMaster <span className="text-teal-500">AI</span>
            </h1>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              v2.0
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            Nền tảng học tiếng Trung & Luyện thi HSK thông minh
          </p>
        </div>
      </div>

      {/* Phải: Trợ lý AI, Chế độ sáng/tối, Thông tin tài khoản */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Nút Trợ lý AI */}
        <button
          onClick={onOpenAiTutor}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
        >
          <Bot className="w-4 h-4 animate-bounce" />
          <span className="hidden sm:inline">Trợ Lý AI</span>
          <span className="sm:hidden font-bold">AI</span>
          <Sparkles className="w-3 h-3 text-yellow-300" />
        </button>

        {/* Nút Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Divider */}
        <div className="h-5 sm:h-6 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 sm:mx-1" />

        {/* User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="text-right hidden md:block">
            <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
              {user?.full_name}
            </div>
            <div>{getRoleBadge()}</div>
          </div>

          {/* Role badge icon for mobile */}
          <div className="md:hidden">
            {getRoleBadge()}
          </div>

          {/* Nút Đăng xuất */}
          <button
            onClick={logout}
            className="p-1.5 sm:p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
