import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, Moon, LogOut, Bot, User, ShieldCheck, 
  GraduationCap, Sparkles, BookOpen 
} from 'lucide-react';

export default function Navbar({ onOpenAiTutor, activeTab, onSelectTab }) {
  const { user, logout, darkMode, toggleDarkMode, isAdmin, isTeacher } = useAuth();

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
          <ShieldCheck className="w-3.5 h-3.5" /> Quản Trị Viên
        </span>
      );
    }
    if (isTeacher) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <GraduationCap className="w-3.5 h-3.5" /> Giáo Viên
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
        <User className="w-3.5 h-3.5" /> Học Sinh
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-teal-500/20 font-chinese">
          汉
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 dark:from-teal-400 dark:to-cyan-300 bg-clip-text text-transparent">
              HSKMaster AI
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              v2.0
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Nền tảng học tiếng Trung & Luyện thi HSK thông minh
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Nút Trợ lý AI */}
        <button
          onClick={onOpenAiTutor}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-sm hover:shadow transition-all"
        >
          <Bot className="w-4 h-4 animate-bounce" />
          <span>Trợ Lý AI</span>
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
        </button>

        {/* Nút Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Thông tin User */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {user?.full_name}
            </div>
            <div>{getRoleBadge()}</div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
