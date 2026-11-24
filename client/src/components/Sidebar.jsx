import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Layers, Headphones, Mic, 
  BookMarked, Edit3, Award, Bot, FileSpreadsheet, 
  UploadCloud, Users, BarChart3, X, ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, isMobileOpen, onClose }) {
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
    { id: 'sheets-sync', label: 'Đồng Bộ Google Sheets', icon: FileSpreadsheet, badge: 'Auto' },
    { id: 'ai-import', label: 'AI Nhập Tài Liệu', icon: UploadCloud, badge: 'AI Core' },
    { id: 'users-manage', label: 'Quản Lý Tài Khoản', icon: Users }
  ];

  const handleItemClick = (id) => {
    onSelectTab(id);
    if (onClose) onClose();
  };

  const menuContent = (
    <div className="space-y-6">
      {/* Nhóm Học tập */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 flex items-center justify-between">
          <span>Học Tiếng Trung HSK</span>
          <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-1.5 py-0.2 rounded">
            HSK 1 - 6
          </span>
        </div>
        <nav className="space-y-1">
          {studyMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm shadow-teal-500/20 font-semibold'
                    : item.highlight
                    ? 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-teal-500' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
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
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
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
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      isActive 
                        ? 'bg-white/20 text-white dark:bg-slate-800 dark:text-slate-200' 
                        : 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
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
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (Hiện trên màn hình vừa và lớn) */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex-col justify-between transition-colors min-h-[calc(100vh-65px)]">
        {menuContent}

        {/* Chân trang Desktop */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center">
          HSKMaster AI EdTech • v2.0
        </div>
      </aside>

      {/* 2. MOBILE DRAWER (Hiện trên điện thoại khi bấm nút Hamburger) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fadeIn">
          {/* Lớp nền mờ tối */}
          <div 
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Ngăn kéo Slide-in từ trái sang */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl p-4 flex flex-col justify-between overflow-y-auto border-r border-slate-200 dark:border-slate-800 animate-slideRight">
            <div>
              {/* Header của Drawer Mobile */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm font-chinese">
                    汉
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      HSKMaster AI
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Menu Chức Năng
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Đóng Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Danh sách Menu */}
              {menuContent}
            </div>

            {/* Chân trang Drawer Mobile */}
            <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
              HSKMaster AI • Giao diện di động
            </div>
          </div>
        </div>
      )}
    </>
  );
}
