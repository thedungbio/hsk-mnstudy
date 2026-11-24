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
import { RefreshCw } from 'lucide-react';

function MainApp() {
  const { user, loading, isAdmin, isTeacher } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return (isAdmin || isTeacher) ? 'admin-dashboard' : 'dashboard';
  });
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);

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
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-xl font-bold">Trợ Lý AI Gia Sư Tiếng Trung Đang Mở</h2>
            <p className="text-xs text-slate-500">Bấm nút bên dưới để mở khung hội thoại trợ lý AI tương tác trực tiếp</p>
            <button
              onClick={() => setIsAiTutorOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-teal-500 text-white font-bold text-xs"
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
      <Navbar
        onOpenAiTutor={() => setIsAiTutorOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

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
