import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Layers, Headphones, Mic, BookMarked, Edit3, Award, 
  Flame, TrendingUp, CheckCircle, ArrowRight, Star
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';

export default function StudentDashboard({ onSelectTab }) {
  const { user } = useAuth();
  const [examHistory, setExamHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getExamHistory()
      .then(res => {
        if (res.success) {
          setExamHistory(res.history || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Tổng hợp dữ liệu biểu đồ từ tiến độ user
  const progressMap = (user?.progress || []).reduce((acc, curr) => {
    acc[curr.skill] = curr.completed_items_count;
    return acc;
  }, {});

  const radarData = [
    { skill: 'Từ vựng (词汇)', value: progressMap['vocabulary'] || 45, fullMark: 100 },
    { skill: 'Nghe (听力)', value: progressMap['listening'] ? progressMap['listening'] * 10 : 70, fullMark: 100 },
    { skill: 'Nói (口语)', value: progressMap['speaking'] ? progressMap['speaking'] * 12 : 65, fullMark: 100 },
    { skill: 'Đọc (阅读)', value: progressMap['reading'] ? progressMap['reading'] * 8 : 80, fullMark: 100 },
    { skill: 'Viết (书写)', value: progressMap['writing'] ? progressMap['writing'] * 10 : 55, fullMark: 100 },
    { skill: 'Ngữ pháp (语法)', value: progressMap['grammar'] ? progressMap['grammar'] * 6 : 75, fullMark: 100 }
  ];

  return (
    <div className="space-y-6">
      {/* Banner chào mừng & Streak */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 text-white p-6 sm:p-8 shadow-xl shadow-teal-500/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
              <Flame className="w-4 h-4 text-amber-300" />
              <span>Chuỗi học tập: 7 ngày liên tiếp!</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chào mừng trở lại, {user?.full_name}! 👋
            </h2>
            <p className="text-teal-100 text-sm leading-relaxed">
              Mục tiêu hôm nay: Ôn luyện 20 từ vựng HSK, hoàn thành 1 bài nghe hội thoại và thử sức với đề thi HSK mô phỏng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('exams')}
              className="px-5 py-3 rounded-2xl bg-white text-teal-800 font-bold text-sm shadow-md hover:bg-teal-50 transition-all flex items-center gap-2 shrink-0"
            >
              <Award className="w-4 h-4 text-teal-600" />
              <span>Vào Thi Thử HSK</span>
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 4 Thẻ chỉ số thống kê */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Từ vựng đã học</span>
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {progressMap['vocabulary'] || 45} <span className="text-xs text-slate-400 font-normal">/ 150 từ</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +12 từ tuần này
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Từ yêu thích</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {user?.starred_count || 4} <span className="text-xs text-slate-400 font-normal">từ vựng</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Sẵn sàng để ôn tập Flashcard
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bài thi đã làm</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {examHistory.length} <span className="text-xs text-slate-400 font-normal">lượt thi</span>
          </div>
          <div className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium">
            Đạt chuẩn HSK mục tiêu
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Điểm cao nhất</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {examHistory.length > 0 ? Math.max(...examHistory.map(e => e.total_score)) : 190} <span className="text-xs text-slate-400 font-normal">điểm</span>
          </div>
          <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
            Xếp loại: Xuất sắc
          </div>
        </div>
      </div>

      {/* Khu vực Biểu đồ Đánh giá Năng lực 4 Kỹ năng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart Kỹ năng */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Bản đồ Kỹ năng Toàn diện (Skills Radar)
              </h3>
              <p className="text-xs text-slate-500">Đánh giá 4 kỹ năng Nghe, Nói, Đọc, Viết và Ngữ pháp</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold">
              HSK 1 - 3
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Năng lực" dataKey="value" stroke="#0d9488" fill="#14b8a6" fillOpacity={0.45} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>🎯 <strong>Kỹ năng cần tập trung:</strong> Luyện Viết (书写) & Luyện Nói (口语)</span>
            <button
              onClick={() => onSelectTab('writing')}
              className="text-teal-600 font-bold hover:underline flex items-center gap-1"
            >
              Luyện ngay <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Lịch sử thi thử HSK gần đây */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  Lịch Sử Thi Thử HSK
                </h3>
                <p className="text-xs text-slate-500">Kết quả và xếp hạng các bài kiểm tra gần nhất</p>
              </div>
              <button
                onClick={() => onSelectTab('exams')}
                className="text-xs font-semibold text-teal-600 hover:underline"
              >
                Tất cả đề thi
              </button>
            </div>

            <div className="space-y-3">
              {examHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Bạn chưa làm bài thi thử nào. Hãy chọn một đề HSK để bắt đầu kiểm tra trình độ!
                </div>
              ) : (
                examHistory.slice(0, 4).map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        {ex.exam_title}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Cấp độ: HSK {ex.hsk_level}</span>
                        <span>•</span>
                        <span>{new Date(ex.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-teal-600 dark:text-teal-400">
                        {ex.total_score} điểm
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ex.is_passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {ex.is_passed ? 'ĐẠT (通过)' : 'CHƯA ĐẠT'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onSelectTab('exams')}
            className="w-full mt-4 py-2.5 rounded-xl border border-teal-500 text-teal-600 dark:text-teal-400 font-semibold text-xs hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
          >
            Luyện thêm đề thi HSK mới
          </button>
        </div>
      </div>
    </div>
  );
}
