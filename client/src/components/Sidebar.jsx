import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Layers, Headphones, Mic, 
  BookMarked, Edit3, Award, Bot, FileSpreadsheet, 
  UploadCloud, Users, BarChart3, ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab }) {
  const { user, isAdmin, isTeacher } = useAuth();

  const studyMenuItems = [
    { id: 'dashboard', label: 'Tổng Quan Học Tập', icon: LayoutDashboard },
    { id: 'vocabulary', label: 'Học Từ Vựng (Flashcard)', icon: Layers },
    { id: 'grammar', label: 'Ngữ Pháp HSK', icon: BookOpen },
    { id: 'listening', label: 'Luyện Nghe (听力)', icon: Headphones },
    { id: 'speaking', label: 'Luyện Nói (口语)', icon: Mic },
    { id: 'reading', label: 'Luyện Đọc (阅读)', icon: BookMarked },
    { id: 'writing', label: 'Luyện Viết (书写)', icon: Edit3 },
    { id: 'exams', label: 'Phòng Thi Thử HSK', icon: Award, highlight: true },
    { id: 'tutor', label: 'Trợ Lý AI Gia Sư', icon: Bot }
  ];

  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'Báo Cáo Hệ Thống', icon: BarChart3 },
    { id: 'sheets-sync', label: 'Đồng Bộ Google Sheets', icon: FileSpreadsheet, badge: 'Bắt buộc' },
    { id: 'ai-import', label: 'AI Nhập Tài Liệu', icon: UploadCloud, badge: 'AI Core' },
    { id: 'users-manage', label: 'Quản Lý Tài Khoản', icon: Users }
  ];

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between transition-colors min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        {/* Nhóm Học tập */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
            Học Tiếng Trung HSK
          </div>
          <nav className="space-y-1">
            {studyMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm shadow-teal-500/20 font-semibold'
                      : item.highlight
                      ? 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-teal-500' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Nhóm Quản trị (Admin & Giáo viên) */}
        {(isAdmin || isTeacher) && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 flex items-center justify-between">
              <span>{isAdmin ? 'Quản Trị Viên (Admin)' : 'Giáo Viên'}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                PRO
              </span>
            </div>
            <nav className="space-y-1">
              {adminMenuItems.map((item) => {
                // Giáo viên chỉ thấy AI Import và Quản lý tài khoản học sinh
                if (isTeacher && !isAdmin && (item.id === 'sheets-sync' || item.id === 'admin-dashboard')) return null;

                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Box thông báo cấp độ HSK */}
      <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-teal-500/10 via-cyan-500/10 to-blue-500/10 border border-teal-500/20 text-xs">
        <div className="flex items-center justify-between font-semibold text-teal-800 dark:text-teal-300 mb-1">
          <span>Khung HSK 3.0</span>
          <span className="px-1.5 py-0.5 rounded bg-teal-500 text-white text-[10px]">HSK 1 - 6</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
          Đầy đủ từ vựng, ngữ pháp, âm thanh phát âm và bài thi chuẩn HSK mới nhất.
        </p>
      </div>
    </aside>
  );
}
