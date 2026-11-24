import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AiTutorWidget from './components/AiTutorWidget';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GoogleSheetsSyncPage from './pages/GoogleSheetsSyncPage';
import AiDocumentImportPage from './pages/AiDocumentImportPage';
import VocabularyPage from './pages/VocabularyPage';
import GrammarPage from './pages/GrammarPage';
import ListeningPage from './pages/ListeningPage';
import SpeakingPage from './pages/SpeakingPage';
import ReadingPage from './pages/ReadingPage';
import WritingPage from './pages/WritingPage';
import HskExamPage from './pages/HskExamPage';
import UsersManagementPage from './pages/UsersManagementPage';
import { 
  RefreshCw, LayoutDashboard, Layers, Award, Bot, 
  Menu, BarChart3, Users, FileSpreadsheet, UploadCloud
} from 'lucide-react';

function MainApp() {
  const { user, loading, isAdmin, isTeacher } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return (isAdmin || isTeacher) ? 'admin-dashboard' : 'dashboard';
  });
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Đang khởi tạo hệ thống HSKMaster AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StudentDashboard onSelectTab={setActiveTab} />;
      case 'admin-dashboard':
        return <AdminDashboard onSelectTab={setActiveTab} />;
      case 'sheets-sync':
        return <GoogleSheetsSyncPage />;
      case 'ai-import':
        return <AiDocumentImportPage />;
      case 'vocabulary':
        return <VocabularyPage />;
      case 'grammar':
        return <GrammarPage />;
      case 'listening':
        return <ListeningPage />;
      case 'speaking':
        return <SpeakingPage />;
      case 'reading':
        return <ReadingPage />;
      case 'writing':
        return <WritingPage />;
      case 'exams':
        return <HskExamPage />;
      case 'users-manage':
        return <UsersManagementPage />;
      case 'tutor':
        return (
          <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
              <Bot className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold">Trợ Lý AI Gia Sư Tiếng Trung Đang Mở</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Bấm nút bên dưới để mở khung hội thoại trợ lý AI tương tác trực tiếp
            </p>
            <button
              onClick={() => setIsAiTutorOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Mở Trợ Lý AI Ngay
            </button>
          </div>
        );
      default:
        return <StudentDashboard onSelectTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <Navbar
        onOpenAiTutor={() => setIsAiTutorOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop & Mobile Drawer) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Dành riêng cho điện thoại) */}
      <nav 
        aria-label="Thanh điều hướng di động"
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 flex items-center justify-around py-1.5 px-1 shadow-lg shadow-slate-900/10"
      >
        {isAdmin || isTeacher ? (
          <>
            {/* Admin Mobile Tabs */}
            <button
              onClick={() => setActiveTab('admin-dashboard')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'admin-dashboard'
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Báo Cáo</span>
            </button>

            <button
              onClick={() => setActiveTab('users-manage')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'users-manage'
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Tài Khoản</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets-sync')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'sheets-sync'
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Sheets</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-import')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'ai-import'
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <UploadCloud className="w-5 h-5" />
              <span>Nhập AI</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
              <span>Menu</span>
            </button>
          </>
        ) : (
          <>
            {/* Student Mobile Tabs */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Tổng Quan</span>
            </button>

            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'vocabulary'
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span>Từ Vựng</span>
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'exams'
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Award className="w-5 h-5 text-amber-500" />
              <span>Thi HSK</span>
            </button>

            <button
              onClick={() => setIsAiTutorOpen(true)}
              className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold text-teal-600 dark:text-teal-400 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
                <Bot className="w-3.5 h-3.5 animate-bounce" />
              </div>
              <span className="font-bold">Trợ Lý AI</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
              <span>Thêm...</span>
            </button>
          </>
        )}
      </nav>

      {/* AI Tutor Widget Modal */}
      <AiTutorWidget
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
