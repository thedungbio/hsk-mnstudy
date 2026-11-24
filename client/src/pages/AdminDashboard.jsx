import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users, Layers, Award, UploadCloud, FileSpreadsheet, 
  BarChart2, RefreshCw, CheckCircle2, ShieldCheck, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function AdminDashboard({ onSelectTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api.getDashboardStats()
      .then(res => {
        if (res.success) {
          setStats(res.stats);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-500" />
        Đang tải dữ liệu báo cáo quản trị...
      </div>
    );
  }

  const hskColors = ['#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'];
  const chartData = (stats?.vocabByHsk || []).map((item, idx) => ({
    name: `HSK ${item.hsk_level}`,
    count: item.count,
    color: hskColors[idx % hskColors.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header báo cáo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Trung Tâm Quản Trị Hệ Thống EdTech
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              Admin & Giáo Viên
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Giám sát toàn bộ tài khoản, đồng bộ Google Sheets, nhập tài liệu AI và kết quả học viên
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onSelectTab('sheets-sync')}
            className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-semibold hover:bg-teal-100 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Đồng bộ Google Sheets</span>
          </button>
          <button
            onClick={() => onSelectTab('ai-import')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-semibold shadow-sm hover:from-teal-600 transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Nhập tài liệu bằng AI</span>
          </button>
        </div>
      </div>

      {/* Grid thẻ chỉ số */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Tổng Học Sinh</span>
            <Users className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {stats?.totalStudents || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Đang hoạt động trên hệ thống</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Kho Từ Vựng HSK</span>
            <Layers className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {stats?.totalVocab || 0}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> Có phát âm & Pinyin
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Đề Thi & Bài Học</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {stats?.totalExams || 0} đề / {(stats?.totalGrammar || 0) + (stats?.totalListening || 0)} bài
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Chuẩn format HSK mới</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Tài Liệu AI Đã Xử Lý</span>
            <UploadCloud className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {stats?.totalDocuments || 0} files
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">Word, Excel, PDF</div>
        </div>
      </div>

      {/* Biểu đồ phân bổ HSK và Kết quả thi gần nhất */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ Bar Chart Từ vựng theo HSK */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">
            Phân Bổ Dữ Liệu Từ Vựng Theo Cấp Độ HSK
          </h3>
          <p className="text-xs text-slate-500 mb-4">Số lượng từ vựng hiện có trong Database từ HSK 1 đến HSK 6</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lượt thi gần đây của học viên */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">
              Hoạt Động Thi Thử Gần Đây Của Học Viên
            </h3>
            <p className="text-xs text-slate-500 mb-4">Theo dõi kết quả điểm số và độ tiến bộ thực tế</p>

            <div className="space-y-2.5">
              {(stats?.recentExamResults || []).length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Chưa có lượt nộp bài thi nào gần đây.
                </div>
              ) : (
                stats.recentExamResults.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.student_name}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {r.exam_title} • HSK {r.hsk_level}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm text-teal-600 dark:text-teal-400">
                        {r.total_score} điểm
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        r.is_passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {r.is_passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onSelectTab('users-manage')}
            className="w-full mt-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Quản lý toàn bộ danh sách tài khoản học sinh & giáo viên
          </button>
        </div>
      </div>
    </div>
  );
}
